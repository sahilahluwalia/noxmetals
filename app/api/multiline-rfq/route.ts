import { NextRequest, NextResponse } from 'next/server';
import { MultilineRFQSchema, formatMultilineRFQZodErrors, calculateTotals } from '../../utils/schemas/multilineRfqSchemas';
import { createClient } from '../../utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Get the user from the request
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to submit an RFQ.' }, 
        { status: 401 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();
    
    const validationResult = MultilineRFQSchema.safeParse(body);
    
    if (!validationResult.success) {
      const formattedErrors = formatMultilineRFQZodErrors(validationResult.error);
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          validationErrors: formattedErrors 
        }, 
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    const { totalItems, totalPieces } = calculateTotals(validatedData.items);

    // Start a transaction to create the RFQ and its items
    const { data: rfq, error: rfqError } = await supabase
      .from('multiline_rfqs')
      .insert({
        user_id: user.id,
        full_name: validatedData.fullName,
        company: validatedData.company,
        email: validatedData.email,
        phone: validatedData.phone || null,
        additional_notes: validatedData.additionalNotes || null,
        dfars_required: validatedData.dfarsRequired,
        rohs_compliant: validatedData.rohsCompliant,
        total_items: totalItems,
        total_pieces: totalPieces,
        status: 'pending'
      })
      .select()
      .single();

    if (rfqError) {
      console.error('Error creating multiline RFQ:', rfqError);
      return NextResponse.json(
        { error: 'Failed to create RFQ. Please try again.' }, 
        { status: 500 }
      );
    }

    // Create the RFQ items
    const itemsToInsert = validatedData.items.map(item => ({
      rfq_id: rfq.id,
      material: item.material,
      material_spec: item.materialSpec || null,
      length: parseFloat(item.length),
      width: parseFloat(item.width),
      height: parseFloat(item.height),
      quantity: parseInt(item.quantity),
      description: item.description || null
    }));

    const { error: itemsError } = await supabase
      .from('multiline_rfq_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Error creating RFQ items:', itemsError);
      
      // Clean up the RFQ if items creation failed
      await supabase
        .from('multiline_rfqs')
        .delete()
        .eq('id', rfq.id);

      return NextResponse.json(
        { error: 'Failed to create RFQ items. Please try again.' }, 
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      message: 'Multi-line RFQ submitted successfully!',
      rfq_id: rfq.id,
      total_items: totalItems,
      total_pieces: totalPieces
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in multiline RFQ submission:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the user from the request
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to view RFQs.' }, 
        { status: 401 }
      );
    }

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const rfqId = searchParams.get('id');

    if (rfqId) {
      // Get specific RFQ with items
      const { data, error } = await supabase
        .rpc('get_multiline_rfq_with_items', { rfq_uuid: rfqId });

      if (error) {
        console.error('Error fetching RFQ details:', error);
        return NextResponse.json(
          { error: 'Failed to fetch RFQ details.' }, 
          { status: 500 }
        );
      }

      if (!data || data.length === 0) {
        return NextResponse.json(
          { error: 'RFQ not found.' }, 
          { status: 404 }
        );
      }

      return NextResponse.json(data[0], { status: 200 });
    } else {
      // Get all RFQs for the user
      const { data, error } = await supabase
        .from('multiline_rfqs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching multiline RFQs:', error);
        return NextResponse.json(
          { error: 'Failed to fetch RFQs.' }, 
          { status: 500 }
        );
      }

      return NextResponse.json(data || [], { status: 200 });
    }

  } catch (error) {
    console.error('Unexpected error in multiline RFQ fetch:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' }, 
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth/options'; // You'll need to create this

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use the authOptions from a centralized location
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }
    
    // Check if the user is requesting their own profile
    if (session.user.id !== params.id) {
      return NextResponse.json(
        { error: 'You can only access your own profile' },
        { status: 403 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Get user from the database
    const user = await db.collection('users').findOne({
      _id: new ObjectId(params.id),
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return user data, removing sensitive information
    return NextResponse.json({
      id: user._id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      phone: user.phone || '',
      location: user.location || '',
      postalCode: user.postalCode || '',
      occupation: user.occupation || '',
      binsReported: user.binsReported || 0,
      binsUtilized: user.binsUtilized || 0,
      totalEcoCoins: user.totalEcoCoins || 0,
      totalCoupons: user.totalCoupons || 0,
      badge: user.badge || 'Eco Newbie',
    });
  } catch (error) {
    console.error('Error in GET /api/users/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use the authOptions from a centralized location
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }
    
    // Check if the user is updating their own profile
    if (session.user.id !== params.id) {
      return NextResponse.json(
        { error: 'You can only update your own profile' },
        { status: 403 }
      );
    }
    
    // Get the updated data from the request
    const data = await request.json();
    
    // Validate the data
    // (Add more validation as needed)
    const validFields = [
      'firstName',
      'lastName',
      'phone',
      'location',
      'postalCode',
      'occupation',
    ];
    
    const updateData = {};
    for (const field of validFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Update user in the database
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      // Create a new user profile if it doesn't exist
      await db.collection('users').insertOne({
        _id: new ObjectId(params.id),
        email: session.user.email,
        ...updateData,
        binsReported: 0,
        binsUtilized: 0,
        totalEcoCoins: 0,
        totalCoupons: 0,
        badge: 'Eco Newbie',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    return NextResponse.json({ success: true, updated: updateData });
  } catch (error) {
    console.error('Error in PATCH /api/users/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
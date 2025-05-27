import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth/options'; // Fixed import path

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }
    
    // For JWT strategy, we need to handle user ID differently
    const userId = session.user.id || session.user.email; // Fallback to email if id not available
    
    if (userId !== params.id && session.user.email !== params.id) {
      return NextResponse.json(
        { error: 'You can only access your own profile' },
        { status: 403 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Try to find user by ID first, then by email
    let user;
    try {
      user = await db.collection('users').findOne({
        _id: new ObjectId(params.id),
      });
    } catch {
      // If ID is not a valid ObjectId, try finding by email
      user = await db.collection('users').findOne({
        email: params.id,
      });
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
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
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id || session.user.email;
    
    if (userId !== params.id && session.user.email !== params.id) {
      return NextResponse.json(
        { error: 'You can only update your own profile' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    const validFields = [
      'firstName',
      'lastName',
      'phone',
      'location',
      'postalCode',
      'occupation',
    ];
    
    const updateData: any = {};
    for (const field of validFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Try to update by ObjectId first, then by email
    let result;
    try {
      result = await db.collection('users').updateOne(
        { _id: new ObjectId(params.id) },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
    } catch {
      result = await db.collection('users').updateOne(
        { email: params.id },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
    }
    
    if (result.matchedCount === 0) {
      // Create a new user profile if it doesn't exist
      await db.collection('users').insertOne({
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
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
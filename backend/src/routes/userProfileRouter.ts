import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { supabase } from '../lib/supabase';
import { userProfileService } from '../services/userProfileService';

const router = Router();

// Create or update user profile
router.post('/create', asyncHandler(async (req: Request, res: Response) => {
    const { phone_number, verification_id, age, gender } = req.body;

    if (!phone_number || !verification_id || !age || !gender) {
        return res.status(400).json({
            success: false,
            message: 'Phone number, verification ID, age, and gender are required',
        });
    }

    try {
        const { error: insertError } = await userProfileService.upsertProfile({
            phone_number,
            age,
            gender,
            verification_id,
        });

        if (insertError) {
            console.error('Error creating user profile:', insertError);
            throw new Error('Failed to create user profile');
        }

        console.log(`✅ Created new user profile for ${phone_number}`);

        res.json({
            success: true,
            message: 'User profile created successfully',
        });

    } catch (error) {
        console.error('Error managing user profile:', error);
        res.status(500).json({
            success: false,
            errorCode: 'PROFILE_OPERATION_FAILED',
            message: 'Failed to manage user profile',
        });
    }
}));

router.post('/get-via-verification-id', asyncHandler(async (req: Request, res: Response) => {
    const { verification_id } = req.body;

    if (!verification_id) {
        return res.status(400).json({
            success: false,
            message: 'Verification ID is required',
        });
    }

    try {
        const { data: userProfile, error: userProfileError } = await userProfileService.getProfileViaVerificationId(verification_id);

        if (userProfileError) {
            console.error('Error getting user profile:', userProfileError);
            throw new Error('Failed to get user profile');
        }

        res.json({
            success: true,
            message: 'User profile created successfully',
            userProfile,
        });

    } catch (error) {
        console.error('Error managing user profile:', error);
        res.status(500).json({
            success: false,
            errorCode: 'PROFILE_OPERATION_FAILED',
            message: 'Failed to manage user profile',
        });
    }
}));

router.post('/get-via-phone-number', asyncHandler(async (req: Request, res: Response) => {
    const { phone_number } = req.body;

    if (!phone_number) {
        return res.status(400).json({
            success: false,
            message: 'Phone number is required',
        });
    }

    console.log('Getting user profile via phone number:', phone_number);

    try {
        const { data: userProfile, error: userProfileError } = await userProfileService.getProfileViaPhoneNumber(phone_number);

        if (userProfileError) {
            console.error('Error getting user profile:', userProfileError);
            throw new Error('Failed to get user profile');
        }

        res.json({
            success: true,
            message: 'User profile created successfully',
            user_profile: userProfile,
        });

    } catch (error) {
        console.error('Error managing user profile:', error);
        res.status(500).json({
            success: false,
            errorCode: 'PROFILE_OPERATION_FAILED',
            message: 'Failed to manage user profile',
        });
    }
}));

// Health check endpoint
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
    try {
        // Test Supabase connection
        const { data: testQuery, error: dbError } = await supabase
            .from('users')
            .select('count')
            .limit(1);

        res.json({
            success: true,
            message: 'User Profile Service is healthy',
            database: {
                connected: !dbError,
                error: dbError?.message || null
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({
            success: false,
            message: 'Health check failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));

export { router as userProfileRouter };
export default router;
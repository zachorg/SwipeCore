import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { IsEmptyRowError, supabase, UserProfile } from '../lib/supabase';
import { userProfileService } from '../services/userProfileService';
import { UserProfileRequest, UserProfileResponse } from '../types/userProfileTypes';
import { requireAuth, sessions } from '../auth/auth';

const router = Router();

// Create or update user profile
router.post('/create', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const sid = req.body.sid;
    const session = sessions.get(sid);

    if (!session) {
        const response: UserProfileResponse = {
            success: false,
            errorCode: 'UNAUTHORIZED',
            message: 'Unauthorized',
        }
        return res.status(401).json(response);
    }

    const { age, gender } = req.body.request as UserProfileRequest;
    if (!age || !gender) {
        const response: UserProfileResponse = {
            success: false,
            errorCode: 'BAD_REQUEST',
            message: 'age, and gender are required',
        }
        return res.status(400).json(response);
    }

    try {
        const { error: insertError } = await userProfileService.upsertProfile({
            id: session.uid,
            age,
            gender,
        });

        if (insertError) {
            console.error('Error creating user profile:', insertError);
            throw new Error('Failed to create user profile');
        }

        const response: UserProfileResponse = {
            success: true,
            message: 'User profile created successfully',
        }
        return res.json(response);

    } catch (error) {
        console.error('Error managing user profile:', error);

        const response: UserProfileResponse = {
            success: false,
            errorCode: 'PROFILE_OPERATION_FAILED',
            message: 'Failed to create user profile',
        }
        return res.status(500).json(response);
    }
}));

router.get("/me", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const sid = req.body.sid;
    const session = sessions.get(sid);

    if (session === undefined) {
        return res.status(401).json({
            success: false,
            errorCode: 'UNAUTHORIZED',
            message: 'Unauthorized',
        });
    }

    try {
        const { data: userProfile, error: userProfileError } = await userProfileService.getProfile(session.uid);

        if (userProfileError) {
            if (IsEmptyRowError(userProfileError)) {
                return res.json({
                    success: false,
                    errorCode: 'PROFILE_NOT_FOUND',
                    message: 'User profile doesn not exist',
                });
            }
            else {
                console.error('Error getting user profile:', userProfileError);
                throw new Error(`Failed to get user profile ${JSON.stringify(userProfileError)}`);
            }
        }

        const userProfileResponse: Omit<UserProfile, 'id'> = {
            age: userProfile.age,
            gender: userProfile.gender,
            phone_number: userProfile.phone_number,
            created_at: userProfile.created_at,
            updated_at: userProfile.updated_at,
        };

        const response: UserProfileResponse = {
            success: true,
            message: 'User profile fetched successfully',
            userProfile: userProfileResponse,
        }

        return res.json(response);

    } catch (error) {
        console.error('Error managing user profile:', error);
        return res.status(500).json({
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
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, ArrowRight } from "lucide-react";
import userProfileService from "@/services/userProfileService";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfileScreenProps {
  onComplete: () => void;
}

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({
  onComplete,
}) => {
  const { isAuthenticated, setUserProfile } = useAuth();
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<
    "male" | "female" | "other" | "prefer-not-to-say"
  >("prefer-not-to-say");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const uploadingUserProfile = useRef<any>(false);
  const ageRef = useRef<string>("");
  const genderRef = useRef<"male" | "female" | "other" | "prefer-not-to-say">(
    "prefer-not-to-say"
  );

  useEffect(() => {
    ageRef.current = age;
    genderRef.current = gender;
  }, [age, gender]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadingUserProfile.current) {
      return;
    }

    if (!ageRef.current || !genderRef.current) {
      setError("Please fill in all fields");
      return;
    }

    const ageNum: number = parseInt(age);
    if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      setError("Please enter a valid age between 13 and 120");
      return;
    }

    if (!isAuthenticated) {
      setError("User not authenticated");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      uploadingUserProfile.current = true;

      await userProfileService.createNewUserProfile({
        age: ageNum,
        gender,
      });

      setUserProfile({
        age: ageNum,
        gender,
        phone_number: "",
      });

      uploadingUserProfile.current = false;

      console.log("Profile saved successfully");
      onComplete();
    } catch (error: any) {
      console.error("Error saving profile:", error);
      setError("Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-8">
      <div className="max-w-sm mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Tell Us About Yourself
          </h1>
          <p className="text-gray-600">Help us personalize your experience</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Age Input */}
          <div>
            <label
              htmlFor="age"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Age
            </label>
            <Input
              id="age"
              type="number"
              placeholder="25"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min="13"
              max="120"
              className="text-center text-lg"
              disabled={isLoading}
            />
          </div>

          {/* Gender Select */}
          <div>
            <label
              htmlFor="gender"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Gender
            </label>
            <Select
              value={gender}
              onValueChange={(
                value: "male" | "female" | "other" | "prefer-not-to-say"
              ) => setGender(value)}
              disabled={isLoading}
            >
              <SelectTrigger className="text-center text-lg">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer-not-to-say">
                  Prefer not to say
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !age || !gender}
            className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-3 rounded-xl"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </div>
            ) : (
              <>
                Complete Setup
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

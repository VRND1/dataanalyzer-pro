import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Edit2, Save, X, Camera, User } from "lucide-react";
import { updateUserProfile } from "@/services/userService";
import { Activity } from "@/types/user";

interface ProfileProps {
  initialName?: string;
  initialBio?: string;
  initialAvatarUrl?: string;
}

const Profile: React.FC<ProfileProps> = ({ 
  initialName = "", 
  initialBio = "", 
  initialAvatarUrl = "" 
}) => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState(initialBio);
  const [editedName, setEditedName] = useState(initialName);
  const [profileImage, setProfileImage] = useState(initialAvatarUrl);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with user data when it changes
  useEffect(() => {
    if (user) {
      setEditedName(user.name || "");
      setEditedBio(user.bio || "");
      setProfileImage(user.avatarUrl || "");
    }
  }, [user]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Call your API to update the profile
      const updatedUser = await updateUserProfile({
        name: editedName,
        bio: editedBio,
        avatarUrl: profileImage
      });
      
      // Update the auth context with new user data
      updateUser(updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
      // Handle error (maybe show a toast notification)
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedBio(user?.bio || initialBio);
    setEditedName(user?.name || initialName);
    setProfileImage(user?.avatarUrl || initialAvatarUrl);
    setIsEditing(false);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Stats data - replace with actual user data
  const userStats = {
    analyses: user?.analysisCount || 0,
    workspaces: user?.workspaceCount || 0,
    collaborations: user?.collaborationCount || 0
  };

  // Recent activity - replace with actual user activity
  const recentActivities: Activity[] = user?.recentActivities || [
    { id: 1, type: "analysis", action: "Created new analysis", timestamp: "2 hours ago" },
    { id: 2, type: "workspace", action: "Shared workspace", timestamp: "1 day ago" },
    { id: 3, type: "collaboration", action: "Joined project", timestamp: "3 days ago" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="relative h-48 bg-gradient-to-r from-blue-500 to-indigo-600">
            <div className="absolute -bottom-16 left-8">
              <div className="relative group">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center shadow-lg">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                {isEditing && (
                  <button 
                    onClick={handleImageClick}
                    className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 transition-colors opacity-100 group-hover:scale-110 transform duration-200"
                  >
                    <Camera className="w-5 h-5 text-gray-600" />
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6 pt-20">
            <div className="flex justify-between items-start">
              <div className="w-full">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Bio
                      </label>
                      <textarea
                        value={editedBio}
                        onChange={(e) => setEditedBio(e.target.value)}
                        placeholder="Tell us about yourself"
                        className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h1 className="text-2xl font-semibold text-black">
                      {editedName || "Welcome! Add your name"}
                    </h1>
                    <p className="mt-3 text-gray-700">
                      {editedBio || "Add a bio to tell others about yourself"}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 ml-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium disabled:opacity-70"
                    >
                      {isLoading ? (
                        "Saving..."
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 font-medium"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="bg-gray-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-gray-800">{userStats.analyses}</div>
                <div className="text-sm text-gray-500">Analyses</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-gray-800">{userStats.workspaces}</div>
                <div className="text-sm text-gray-500">Workspaces</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-gray-800">{userStats.collaborations}</div>
                <div className="text-sm text-gray-500">Collaborations</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Settings className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-gray-800">{activity.action}</p>
                      <p className="text-sm text-gray-500">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 
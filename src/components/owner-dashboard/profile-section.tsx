"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { User, Shield, Mail, Calendar, Lock, LogOut, Loader2 } from "lucide-react"
import { fetchUser, updateUser, getUserFromToken } from "@/lib/api"
import { toast } from "sonner"

export function ProfileSection() {
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        async function initUserProfile() {
            const tokenUser = getUserFromToken();
            if (tokenUser?.sub) {
                try {
                    const userData = await fetchUser(tokenUser.sub);
                    setCurrentUser(userData);
                } catch (err) {
                    console.error("Failed to fetch user profile", err);
                }
            }
        }
        initUserProfile();
    }, [])

    useEffect(() => {
        const initialName = currentUser?.name || ''
        setName(initialName)
    }, [currentUser])

    const userRole = currentUser?.role === 0 ? 'Store Owner' :
        currentUser?.role === 4 ? 'Store Manager' :
            currentUser?.role === 3 ? 'Branch User' :
                currentUser?.role === 1 ? 'Customer Admin' : 'User';

    const userEmail = currentUser?.email || 'N/A';
    const joinedDate = currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : 'N/A';
    const userStatus = currentUser?.status || 'active';

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        const tokenUser = getUserFromToken();
        const userId = currentUser?.id || tokenUser?.sub;

        if (!userId) {
            toast.error("User session invalid. Please log in again.");
            return;
        }

        setLoading(true)
        try {
            const payload: any = {};
            if (password) payload.password = password;
            if (name && name !== currentUser?.name) payload.name = name;

            if (Object.keys(payload).length === 0) {
                toast.info("Profile is up to date.");
                setLoading(false);
                return;
            }

            await updateUser(userId, payload);
            const updatedUser = await fetchUser(userId);
            setCurrentUser(updatedUser);
            toast.success("Profile updated successfully!");

            setPassword('');
        } catch (err: any) {
            toast.error("Failed to update profile: " + err.message);
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl space-y-8">
            {/* Profile Header */}
            <div className="flex items-center gap-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold border-4 border-white shadow-sm">
                    {name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : <User className="h-10 w-10" />}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{name || 'User'}</h2>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> {userRole}</span>
                        <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                        <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {userEmail}</span>
                    </div>
                </div>
                <div className="ml-auto">
                    <Button
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => {
                            sessionStorage.clear();
                            window.location.href = '/auth/login';
                        }}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </div>

            <form onSubmit={handleUpdateProfile}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Personal Information Card */}
                    <Card className="border border-gray-200 bg-white shadow-none h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" />
                                Personal Information
                            </CardTitle>
                            <CardDescription>Manage your public profile details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Display Name</label>
                                <Input
                                    name="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your Name"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    Email Address
                                    <span className="text-xs text-gray-400 font-normal ml-auto flex items-center gap-1"><Lock className="h-3 w-3" /> Read-only</span>
                                </label>
                                <Input
                                    value={userEmail}
                                    disabled
                                    className="bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Role</label>
                                    <div className="font-medium text-sm flex items-center gap-2">
                                        <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs box-decoration-clone">{userRole}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Status</label>
                                    <div className="font-medium text-sm">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                        ${userStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {userStatus}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Joined On</label>
                                    <div className="font-medium text-sm flex items-center gap-2 text-gray-700">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        {joinedDate}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security Card */}
                    <Card className="border border-gray-200 bg-white shadow-none h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-blue-600" />
                                Security
                            </CardTitle>
                            <CardDescription>Manage your password and account security.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                                    <h4 className="text-sm font-medium text-yellow-800 mb-1">Change Password</h4>
                                    <p className="text-xs text-yellow-700">Ensure your account is using a long, random password to stay secure.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">New Password</label>
                                    <Input
                                        name="password"
                                        type="password"
                                        placeholder="Enter new password to change"
                                        minLength={8}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500">Leave blank if you don't want to change it.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end mt-6">
                    <Button type="submit" disabled={loading} size="lg" className="min-w-[150px]">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : "Save Changes"}
                    </Button>
                </div>
            </form>
        </div>
    )
}

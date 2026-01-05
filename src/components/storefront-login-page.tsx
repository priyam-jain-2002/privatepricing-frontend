"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { loginStorefront, sendStorefrontVerificationCode, verifyStorefrontLoginCode, sendStorefrontPasswordResetCode, resetStorefrontPassword } from "@/lib/api"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface StorefrontLoginPageProps {
    storeName?: string
    storeId: string // Storefront login MUST know the store context
}

export function StorefrontLoginPage({ storeName = "Customer Portal", storeId }: StorefrontLoginPageProps) {
    const router = useRouter()
    const [step, setStep] = useState<'credentials' | 'otp' | 'reset-otp'>('credentials')
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [otp, setOtp] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [resendCooldown, setResendCooldown] = useState(0)
    const [resetStep, setResetStep] = useState(false) // If true, showing reset flows
    const [newPassword, setNewPassword] = useState("")

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [resendCooldown])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            // Standard Email + Password Login
            const data = await loginStorefront({
                storeId,
                email,
                password
            })

            if (data.requiresVerification) {
                // Backend rejected login but triggered OTP. Move to OTP step.
                setStep('otp')
                setResendCooldown(30)
            } else if (data.accessToken) {
                // Success
                finalizeLogin(data)
            } else {
                setError("Invalid credentials.")
            }
        } catch (err: any) {
            setError(err.message || "Failed to login.")
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // Verify Logic (Same as before, but implies verification + login)
            const data = await verifyStorefrontLoginCode(storeId, email, otp)

            if (data && data.accessToken) {
                finalizeLogin(data)
            } else {
                setError("Invalid verification code.")
            }
        } catch (err: any) {
            setError(err.message || "Failed to verify code.")
        } finally {
            setLoading(false)
        }
    }

    const handleForgotPassword = async () => {
        if (!email) {
            setError("Please enter your email first to reset password.")
            return;
        }
        setLoading(true)
        setError(null)
        try {
            await sendStorefrontPasswordResetCode(storeId, email)
            setStep('reset-otp')
            setResendCooldown(30)
            toast.success("Reset Code Sent", {
                description: `Please check ${email} for your verification code.`
            })
        } catch (err: any) {
            setError(err.message || "Failed to send reset code.")
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            await resetStorefrontPassword(storeId, email, otp, newPassword)
            // Success! Go back to login
            setStep('credentials')
            setPassword("")
            setNewPassword("")
            setOtp("")
            setError(null)
            setNewPassword("")
            setOtp("")
            setError(null)
            toast.success("Password Reset Successful!", {
                description: "You can now log in with your new password.",
                duration: 5000,
            })
        } catch (err: any) {
            setError(err.message || "Failed to reset password.")
        } finally {
            setLoading(false)
        }
    }

    const finalizeLogin = (data: any) => {
        localStorage.setItem('access_token', data.accessToken)
        if (data.refreshToken) {
            localStorage.setItem('refresh_token', data.refreshToken)
        }
        const roleNum = typeof data.user?.role === 'number' ? data.user.role : Number(data.user?.role);
        localStorage.setItem('user_role', String(roleNum));

        if (data.redirect) {
            router.push(data.redirect)
        } else if (roleNum === 0 || roleNum === 4 || roleNum === 5) {
            // Redirect Team Members (Owner, Store Manager, Order Manager) to Dashboard
            // assuming 4 and 5 are the manager roles based on enum
            router.push('/dashboard')
        } else {
            router.push('/storefront')
        }
    }

    const handleResend = async () => {
        // Do not set global loading, just trigger resend and cooldown
        setResendCooldown(30)
        try {
            if (step === 'reset-otp') {
                await sendStorefrontPasswordResetCode(storeId, email)
            } else {
                await sendStorefrontVerificationCode(storeId, email)
            }
        } catch (err) {
            console.error(err)
            setResendCooldown(0) // Reset if failed so they can try again
            setError("Failed to resend code")
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50 relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-50 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>

            <div className="w-full max-w-md animate-in fade-in zoom-in duration-700 slide-in-from-bottom-8">
                <Card className="border-gray-200/50 bg-white/70 backdrop-blur-xl shadow-2xl relative overflow-hidden ring-1 ring-black/5">
                    {/* Subtle inner glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-transparent pointer-events-none"></div>

                    <CardHeader className="space-y-2 text-center relative pt-8">
                        <div className="mx-auto w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                            <span className="text-white text-xl font-bold">{storeName.charAt(0)}</span>
                        </div>
                        <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900">
                            {storeName}
                        </CardTitle>
                        <CardDescription>
                            {step === 'credentials' ? "Sign in with your password" :
                                step === 'reset-otp' ? `Reset Password for ${email}` :
                                    `Verification required. Code sent to ${email}`}
                        </CardDescription>
                    </CardHeader>

                    {step === 'credentials' ? (
                        <form onSubmit={handleLogin}>
                            <CardContent className="space-y-6 relative pb-8">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-slate-700 font-medium ml-1">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-12 bg-white/50 border-gray-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between ml-1">
                                        <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                                        <button
                                            type="button"
                                            onClick={handleForgotPassword}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-12 bg-white/50 border-gray-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                {error && (
                                    <div className="text-sm font-medium text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                                        {error}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="flex flex-col gap-4 pb-10">
                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-200 shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Signing In...
                                        </>
                                    ) : (
                                        "Sign In"
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    ) : step === 'reset-otp' ? (
                        <form onSubmit={handleResetPassword}>
                            <CardContent className="space-y-6 relative pb-8">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center ml-1">
                                        <Label htmlFor="otp" className="text-slate-700 font-medium">Reset Code</Label>
                                        <button
                                            type="button"
                                            onClick={() => setStep('credentials')}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                    <Input
                                        id="otp"
                                        type="text"
                                        placeholder="123456"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                        maxLength={6}
                                        className="h-12 bg-white/50 border-gray-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-password" className="text-slate-700 font-medium ml-1">New Password</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        placeholder="New Password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className="h-12 bg-white/50 border-gray-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                {error && (
                                    <div className="text-sm font-medium text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                                        {error}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="flex flex-col gap-4 pb-10">
                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-200 shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Resetting...
                                        </>
                                    ) : (
                                        "Reset Password"
                                    )}
                                </Button>
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={resendCooldown > 0}
                                >
                                    {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Resend Code"}
                                </button>
                            </CardFooter>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyCode}>
                            <CardContent className="space-y-6 relative pb-8">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center ml-1">
                                        <Label htmlFor="otp" className="text-slate-700 font-medium">Verification Code</Label>
                                        <button
                                            type="button"
                                            onClick={() => setStep('credentials')}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Change Email
                                        </button>
                                    </div>
                                    <Input
                                        id="otp"
                                        type="text"
                                        placeholder="123456"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                        maxLength={6}
                                        className="h-12 bg-white/50 border-gray-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                {error && (
                                    <div className="text-sm font-medium text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                                        {error}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="flex flex-col gap-4 pb-10">
                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-200 shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        "Verify & Sign In"
                                    )}
                                </Button>
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={resendCooldown > 0}
                                >
                                    {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Resend Code"}
                                </button>
                            </CardFooter>
                        </form>
                    )}
                </Card>
            </div>
        </div>
    )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { fetchAPI, sendStorefrontVerificationCode, sendStorefrontPasswordResetCode, verifyStorefrontLoginCode, resetStorefrontPassword } from "@/lib/api"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface LoginPageProps {
    storeName?: string
}

export function LoginPage({ storeName = "Private Pricing OS" }: LoginPageProps) {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Auth Flow State
    const [step, setStep] = useState<'credentials' | 'otp' | 'reset-otp'>('credentials')
    const [tempStoreId, setTempStoreId] = useState<string | null>(null)
    const [otp, setOtp] = useState("")
    const [resendCooldown, setResendCooldown] = useState(0)
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
            const data = await fetchAPI(`/users/login`, {
                method: 'POST',
                body: JSON.stringify({ email, password })
            })

            if (data.requiresVerification) {
                // Must be verified
                setTempStoreId(data.storeId)
                setStep('otp')
                // Wait, standard login didn't trigger email send automatically like storefront-login?
                // Actually, StorefrontService logic (reused in StorefrontLogin) did.
                // Here, "login" endpoint just returns flag. 
                // We must trigger send MANUALLY.
                await triggerSendCode(data.storeId, email, 'verification')
            } else if (data.accessToken) {
                finalizeLogin(data)
            } else {
                setError("Invalid response.")
            }
        } catch (err: any) {
            setError(err.message || "Failed to login.")
        } finally {
            setLoading(false)
        }
    }

    const triggerSendCode = async (sid: string, mail: string, type: 'verification' | 'reset') => {
        setResendCooldown(30)
        try {
            if (type === 'verification') {
                await sendStorefrontVerificationCode(sid, mail)
            } else {
                await sendStorefrontPasswordResetCode(sid, mail)
            }
        } catch (e: any) {
            setError(e.message || "Failed to send code")
        }
    }

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!tempStoreId) return;
        setLoading(true)
        setError(null)
        try {
            const data = await verifyStorefrontLoginCode(tempStoreId, email, otp)
            if (data.accessToken) {
                finalizeLogin(data)
            } else {
                setError("Invalid code.")
            }
        } catch (err: any) {
            setError(err.message || "Verification failed.")
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
            // Send without storeId (Backend finds it for Admin)
            const res = await sendStorefrontPasswordResetCode(null, email)

            if (res.storeId) {
                setTempStoreId(res.storeId)
                setStep('reset-otp')
                setResendCooldown(30)
                toast.success("Reset Code Sent", {
                    description: `Please check ${email} for your code.`
                })
            } else {
                setError("User not found or email delivery failed.")
            }
        } catch (err: any) {
            setError(err.message || "Failed to send reset code.")
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!tempStoreId) return

        setLoading(true)
        setError(null)
        try {
            await resetStorefrontPassword(tempStoreId, email, otp, newPassword)
            setStep('credentials')
            setPassword("")
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

    const handleResend = async () => {
        if (!tempStoreId && step !== 'reset-otp') return // Need tempStoreId for verification resend
        // For reset-otp, we can resend without known storeId if we treat it like initial forgot password? 
        // Actually, we SAVED tempStoreId in handleForgotPassword response. So we DO have it.

        setResendCooldown(30)
        try {
            if (step === 'reset-otp') {
                // If we have tempStoreId use it, else null
                await sendStorefrontPasswordResetCode(tempStoreId || null, email)
                toast.success("Code Resent")
            } else {
                if (tempStoreId) await sendStorefrontVerificationCode(tempStoreId, email)
            }
        } catch (e: any) {
            setError(e.message || "Failed to resend code")
        }
    }

    const finalizeLogin = (data: any) => {
        localStorage.setItem('access_token', data.accessToken)
        if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken)
        localStorage.setItem('user_role', String(data.user.role))
        router.push('/dashboard')
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50 relative overflow-hidden">
            <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

            <div className="w-full max-w-md animate-in fade-in zoom-in duration-700 slide-in-from-bottom-8">
                <Card className="border-gray-200/50 bg-white/70 backdrop-blur-xl shadow-2xl relative overflow-hidden ring-1 ring-black/5">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-transparent pointer-events-none"></div>

                    <CardHeader className="space-y-2 text-center relative pt-8">
                        <div className="mx-auto w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                            <span className="text-white text-xl font-bold">P</span>
                        </div>
                        <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900">
                            {storeName}
                        </CardTitle>
                        <CardDescription>
                            {step === 'credentials' ? "Sign in to your dashboard" :
                                step === 'reset-otp' ? "Enter code and new password" :
                                    `Verification code sent to ${email}`}
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
                                        placeholder="you@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-12 bg-white/50 border-gray-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between ml-1">
                                        <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                                        <button type="button" onClick={handleForgotPassword} className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors">Forgot password?</button>
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
                                            Authenticating...
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
                                    {loading ? "Verifying..." : "Verify & Sign In"}
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

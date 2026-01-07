"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { fetchAPI, sendStorefrontVerificationCode, sendStorefrontPasswordResetCode, verifyStorefrontLoginCode, resetStorefrontPassword } from "@/lib/api"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import posthog from "posthog-js"

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
        if (!tempStoreId && step !== 'reset-otp') return

        setResendCooldown(30)
        try {
            if (step === 'reset-otp') {
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
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <Link href="/" className="mb-8 block">
                <span className="font-serif text-2xl font-bold tracking-tight text-foreground">
                    opbase
                </span>
            </Link>

            <Card className="w-full max-w-sm border-0 shadow-none sm:border sm:border-border/50 bg-card rounded-lg relative overflow-hidden">
                <CardHeader className="text-center space-y-2 pb-6">
                    <CardTitle className="text-xl font-medium tracking-tight text-foreground">
                        {step === 'credentials' ? "Sign in" :
                            step === 'reset-otp' ? "Reset Password" : "Verification"}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                        {step === 'credentials' ? "Access your workspace." :
                            step === 'reset-otp' ? "Enter the code sent to your email." :
                                `We sent a code to ${email}`}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {step === 'credentials' ? (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="sr-only">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-10 bg-muted/20 border-border focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60 w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="sr-only">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-10 bg-muted/20 border-border focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60 w-full"
                                />
                            </div>

                            {error && (
                                <div className="text-sm text-destructive bg-destructive/5 p-3 rounded-md border border-destructive/10">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-medium transition-all shadow-sm active:scale-[0.99]"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
                            </Button>

                            <div className="flex justify-between items-center text-xs mt-4">
                                <span className="text-muted-foreground">Forgot password?</span>
                                <button type="button" onClick={handleForgotPassword} className="text-primary hover:underline font-medium">Reset here</button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={step === 'reset-otp' ? handleResetPassword : handleVerifyCode} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="otp" className="sr-only">Code</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder="123456"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    maxLength={6}
                                    className="h-10 bg-muted/20 border-border focus:ring-1 focus:ring-primary focus:border-primary text-center tracking-widest"
                                />
                            </div>

                            {step === 'reset-otp' && (
                                <div className="space-y-2">
                                    <Label htmlFor="new-password" className="sr-only">New Password</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        placeholder="New Password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className="h-10 bg-muted/20 border-border"
                                    />
                                </div>
                            )}

                            {error && (
                                <div className="text-sm text-destructive bg-destructive/5 p-3 rounded-md border border-destructive/10">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-medium transition-all shadow-sm active:scale-[0.99]"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (step === 'reset-otp' ? "Reset Password" : "Verify")}
                            </Button>

                            <div className="flex justify-between items-center text-xs mt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep('credentials')}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    className="text-primary hover:underline disabled:opacity-50"
                                    disabled={resendCooldown > 0}
                                >
                                    {resendCooldown > 0 ? `${resendCooldown}s` : "Resend"}
                                </button>
                            </div>
                        </form>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col gap-4 border-t border-border/40 p-6 bg-muted/10 text-center">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            This system is usually accessed by invited teams or customers.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            If you were invited, use the email you received the link on.
                        </p>
                    </div>

                    <Link
                        href="/#early-access"
                        onClick={() => posthog.capture('book_demo_clicked', { location: 'login_page' })}
                        className="text-xs font-medium text-primary hover:text-primary/80 hover:underline transition-all flex items-center justify-center gap-1 mt-2"
                    >
                        Don't have an account? Request a Demo
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}

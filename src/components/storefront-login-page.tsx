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
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="mb-8 text-center">
                <div className="mx-auto w-10 h-10 bg-primary rounded-lg flex items-center justify-center mb-4 text-primary-foreground font-serif font-bold text-lg">
                    {storeName ? storeName.charAt(0) : 'S'}
                </div>
                <h1 className="text-2xl font-serif font-bold tracking-tight text-foreground">
                    {storeName}
                </h1>
            </div>

            <Card className="w-full max-w-sm border-0 shadow-none sm:border sm:border-border/50 bg-card rounded-lg relative overflow-hidden">
                <CardHeader className="text-center space-y-2 pb-6">
                    <CardTitle className="text-xl font-medium tracking-tight text-foreground">
                        {step === 'credentials' ? "Welcome back" :
                            step === 'reset-otp' ? "Reset Password" : "Verification Required"}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                        {step === 'credentials' ? "Sign in to your customer portal." :
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
                    ) : step === 'reset-otp' ? (
                        <form onSubmit={handleResetPassword} className="space-y-4">
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
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
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
                    ) : (
                        <form onSubmit={handleVerifyCode} className="space-y-4">
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
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
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

                <CardFooter className="flex flex-col gap-2 border-t border-border/40 p-6 bg-muted/10 text-center">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Access to this portal is restricted to authorized customers.
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}

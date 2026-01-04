"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { loginStorefront } from "@/lib/api"
import { Loader2 } from "lucide-react"

interface StorefrontLoginPageProps {
    storeName?: string
    storeId: string // Storefront login MUST know the store context
}

export function StorefrontLoginPage({ storeName = "Customer Portal", storeId }: StorefrontLoginPageProps) {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const data = await loginStorefront({
                storeId,
                email,
                password
            })

            if (data && data.accessToken) {
                // Store in Local Storage
                localStorage.setItem('access_token', data.accessToken)
                if (data.refreshToken) {
                    localStorage.setItem('refresh_token', data.refreshToken)
                }

                // Keep role as string for consistency
                const roleNum = typeof data.user?.role === 'number' ? data.user.role : Number(data.user?.role);
                localStorage.setItem('user_role', String(roleNum));

                if (data.redirect) {
                    router.push(data.redirect)
                } else if (roleNum === 0) {
                    // Explicit Store Owner Redirection
                    router.push('/dashboard')
                } else {
                    // Default Customer Flow
                    router.push('/storefront')
                }
            } else {
                setError("Invalid credentials.")
            }
        } catch (err: any) {
            setError("Failed to login. Please check your credentials.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50 relative overflow-hidden">
            {/* Ambient Background Elements - subtle colors for light theme storefront */}
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

                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6 relative pb-8">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-700 font-medium ml-1">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-12 bg-white/50 border-gray-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                                    <button type="button" className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors">Request Access</button>
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
                                        Verifying...
                                    </>
                                ) : (
                                    "Sign In to Store"
                                )}
                            </Button>
                            <p className="text-center text-slate-400 text-xs font-medium">
                                Restricted Access. Exclusive for {storeName} Partners.
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
}

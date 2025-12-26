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
                sessionStorage.setItem('access_token', data.accessToken)

                if (data.redirect) {
                    // Backend is telling us where to go (e.g. Admin -> Dashboard)
                    router.push(data.redirect)
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
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
            <Card className="max-w-md w-full shadow-lg border-gray-100">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {storeName}
                    </CardTitle>
                    <CardDescription>
                        Access your customer account or store dashboard.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>
                        {error && (
                            <div className="text-sm font-medium text-red-500 bg-red-50 p-3 rounded-md border border-red-100">
                                {error}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full h-11 text-base bg-blue-600 hover:bg-blue-700 font-medium"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}

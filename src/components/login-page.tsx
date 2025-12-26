"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { fetchAPI } from "@/lib/api"
import { Loader2 } from "lucide-react"

interface LoginPageProps {
    storeName?: string
}

export function LoginPage({ storeName = "Private Pricing OS" }: LoginPageProps) {
    const router = useRouter()
    const [storeId, setStoreId] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // Login to get JWT
            const data = await fetchAPI(`/users/login`, {
                method: 'POST',
                body: JSON.stringify({ email, password })
            })

            // ... rest of logic ...

            // Expecting { accessToken: string, context: ... }
            if (data && data.accessToken) {
                // Store in Session Storage
                sessionStorage.setItem('access_token', data.accessToken)

                if (data.context?.store?.id) {
                    sessionStorage.setItem('store_id', data.context.store.id)
                }

                if (data.user) {
                    sessionStorage.setItem('user_id', data.user.id)
                    sessionStorage.setItem('user_role', String(data.user.role))
                    if (data.user.name) sessionStorage.setItem('user_name', data.user.name)
                }

                if (data.context) {
                    if (data.context.customer?.id) sessionStorage.setItem('customer_id', data.context.customer.id)
                    if (data.context.branch?.id) sessionStorage.setItem('branch_id', data.context.branch.id)
                }

                // Redirect based on role
                const role = Number(data.user.role)
                if (role === 0) { // Store Owner
                    router.push('/dashboard')
                } else {
                    router.push('/storefront')
                }
            } else {
                setError("Invalid response from server.")
            }
        } catch (err: any) {
            setError(err.message || "Failed to login. Please check your credentials.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
            <Card className="max-w-md w-full shadow-lg border-gray-100">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        Welcome to {storeName}
                    </CardTitle>
                    <CardDescription>
                        Enter your credentials to access your exclusive pricing.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@company.com"
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
                    <CardFooter className="flex flex-col gap-4">
                        <Button
                            type="submit"
                            className="w-full h-11 text-base bg-blue-600 hover:bg-blue-700 font-medium"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying Access...
                                </>
                            ) : (
                                "Access Store"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}

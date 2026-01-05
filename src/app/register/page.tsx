
"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { completeUserRegistration, completeStorefrontRegistration, fetchStoreBySubdomain } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export default function RegisterPage() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const token = searchParams.get('token')
    const email = searchParams.get('email')

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [isStorefront, setIsStorefront] = useState(false)
    const [storeId, setStoreId] = useState<string | null>(null)
    const [storeName, setStoreName] = useState("")
    const [checkingContext, setCheckingContext] = useState(true)

    useEffect(() => {
        const checkContext = async () => {
            const paramStoreId = searchParams.get('storeId');

            if (paramStoreId) {
                try {
                    // We need a way to fetch store by ID publicly or just trust the ID for the completion call?
                    // actually fetchStoreBySubdomain fetches public store info.
                    // We need fetchStoreById public? Or just use subdomain if we had it.
                    // Let's assume completeRegistration will validate the storeId.
                    // But we want to show the store Name.
                    // We can try to fetch store name or just proceed.
                    // Since we don't have a public "fetchStoreById", let's assume we can rely on the user knowing context or blindly submitting.
                    // Wait, fetchStoreBySubdomain is public.
                    // Ideally we should have a public "get basic store info" by ID too.
                    // For now, let's just use the storeId for the submission.
                    // We can't easily show the name without an endpoint.
                    setIsStorefront(true);
                    setStoreId(paramStoreId);
                    setStoreName("Storefront"); // Fallback
                    setCheckingContext(false);
                    return;
                } catch (e) {
                    // ignore
                }
            }

            const hostname = window.location.hostname;
            // Extract subdomain
            const parts = hostname.split('.');
            let subdomain = '';
            let isLocal = hostname.includes('localhost');

            if (isLocal) {
                if (parts[0] !== 'localhost') subdomain = parts[0];
            } else {
                // e.g. store.opbase.in -> store
                if (parts.length > 2) subdomain = parts[0];
            }

            // If subdomain exists and is not 'app' or 'www'
            if (subdomain && subdomain !== 'www' && subdomain !== 'app' && subdomain !== 'storefront') {
                try {
                    const store = await fetchStoreBySubdomain(subdomain);
                    if (store && store.id) {
                        setIsStorefront(true);
                        setStoreId(store.id);
                        setStoreName(store.name);
                    }
                } catch (e) {
                    console.error("Failed to fetch store context", e);
                }
            }
            setCheckingContext(false);
        }
        checkContext();
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (!token || !email) {
            toast.error("Invalid invitation link");
            return;
        }

        setLoading(true);
        try {
            if (isStorefront) {
                if (!storeId) throw new Error("Store context missing. Please ensure you are accessing this link from the valid store domain.");
                const data = await completeStorefrontRegistration({
                    storeId,
                    email,
                    token,
                    password
                });

                // Store tokens and redirect
                localStorage.setItem('access_token', data.accessToken);
                if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken);
                // For storefront, we might not need user_role or might use it differently
                if (data.user) localStorage.setItem('user_role', String(data.user.role));

                toast.success("Registration complete! Logging you in...");
                router.push(data.redirect || '/storefront');
            } else {
                const data = await completeUserRegistration({
                    email,
                    token,
                    password
                });

                // Store tokens and redirect
                localStorage.setItem('access_token', data.accessToken);
                if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken);
                if (data.user) localStorage.setItem('user_role', String(data.user.role));

                toast.success("Registration complete! Logging you in...");
                router.push('/dashboard');
            }
        } catch (err: any) {
            toast.error(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    }

    if (!token || !email) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded shadow text-gray-800">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Invalid Link</h2>
                    <p>This invitation link is incomplete or invalid.</p>
                </div>
            </div>
        )
    }

    if (checkingContext) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg border border-gray-100">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isStorefront ? `Join ${storeName}` : 'Join the Team'}
                    </h1>
                    <p className="text-gray-600 mt-2">Set your password to accept the invitation for <strong className="text-gray-900">{email}</strong></p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label>New Password</Label>
                        <Input
                            type="password"
                            required
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Confirm Password</Label>
                        <Input
                            type="password"
                            required
                            minLength={8}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {loading ? "Setting Password..." : "Set Password & Login"}
                    </Button>
                </form>
            </div>
        </div>
    )
}

"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { fetchStoreUsers, createUser, updateUser, deleteUser } from "@/lib/api"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { DeleteConfirmationDialog } from "../delete-confirmation-dialog"

interface TeamSectionProps {
    activeStore: any
}

export function TeamSection({ activeStore }: TeamSectionProps) {
    const [storeUsers, setStoreUsers] = useState<any[]>([])
    const [editingStoreUser, setEditingStoreUser] = useState<any>(null)
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

    useEffect(() => {
        loadStoreUsers()
    }, [activeStore])

    const loadStoreUsers = async () => {
        try {
            const data = await fetchStoreUsers()
            setStoreUsers(data)
        } catch (err) {
            console.error("Failed to fetch store users", err)
        }
    }

    const handleCreateStoreUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const roleStr = formData.get('role') as string;
        const roleId = parseInt(roleStr);

        try {
            await createUser({
                email,
                password,
                name,
                role: roleId,
                storeId: activeStore.id
            });

            await loadStoreUsers()
            form.reset();
            toast.success("Team member created successfully!");
        } catch (err: any) {
            toast.error("Failed to create user: " + err.message);
        }
    }

    const handleUpdateStoreUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStoreUser) return;

        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const name = formData.get('name') as string;
        const password = formData.get('password') as string;

        try {
            const payload: any = { name };
            if (password) payload.password = password;

            await updateUser(editingStoreUser.id, payload);

            await loadStoreUsers();
            setEditingStoreUser(null);
            toast.success("User updated successfully!");
        } catch (err: any) {
            toast.error("Failed to update user: " + err.message);
        }
    }

    const handleDeleteStoreUser = async () => {
        if (!deletingUserId) return;

        try {
            await deleteUser(deletingUserId);
            await loadStoreUsers();
            toast.success("Team member deleted successfully!");
        } catch (err: any) {
            toast.error("Failed to delete user: " + err.message);
        } finally {
            setDeletingUserId(null);
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium mb-4">Add Team Member</h3>
                <form onSubmit={handleCreateStoreUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input name="name" required placeholder="Jane Doe" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input name="email" type="email" required placeholder="manager@store.com" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>
                        <Input name="password" type="password" required minLength={8} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Role</label>
                        <select
                            name="role"
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            required
                            defaultValue="4"
                        >
                            <option value="4">Store Manager</option>
                            <option value="5">Order Manager</option>
                        </select>
                    </div>
                    <Button type="submit">Add Member</Button>
                </form>
            </div>

            <Card className="border border-gray-200 bg-white shadow-none">
                <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage users who have access to this store.</CardDescription>
                </CardHeader>
                <div className="overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {storeUsers.filter(u => u.role === 0 || u.role === 4 || u.role === 5).length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No team members found.</td></tr>
                            ) : storeUsers.filter(u => u.role === 0 || u.role === 4 || u.role === 5).map((user) => (
                                <tr key={user.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {user.role === 0 ? 'Store Owner' :
                                            user.role === 4 ? 'Store Manager' :
                                                user.role === 5 ? 'Order Manager' :
                                                    user.role === 3 ? 'Branch User' :
                                                        user.role === 1 ? 'Customer Admin' : 'Unknown'}
                                    </td>

                                    <td className="px-6 py-4 text-sm text-right space-x-2">
                                        {user.role !== 0 && (
                                            <>
                                                <Button variant="outline" size="sm" onClick={() => setEditingStoreUser(user)}>Edit</Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => setDeletingUserId(user.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Dialog open={!!editingStoreUser} onOpenChange={(open) => !open && setEditingStoreUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Team Member</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateStoreUser} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Name</label>
                            <Input name="name" defaultValue={editingStoreUser?.name} required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Password</label>
                            <Input name="password" type="password" placeholder="Leave blank to keep" minLength={8} />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setEditingStoreUser(null)}>Cancel</Button>
                            <Button type="submit">Save Changes</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <DeleteConfirmationDialog
                open={!!deletingUserId}
                onOpenChange={(open) => !open && setDeletingUserId(null)}
                onConfirm={handleDeleteStoreUser}
                title="Delete Team Member"
                description="Are you sure you want to delete this team member? They will lose access to the dashboard immediately."
            />
        </div>
    )
}

import useSwr from 'swr';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import TableManagement from "@/components/tables/Table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Ban, CheckCircle, Search, Users, X, Edit } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { BASE_API, API_VERSION } from "../../config.json";

export default function AdminUsers() {
    const location = useLocation();
    const { user } = useAuth();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const fetcher = (url) => fetch(url, { 
        headers: { 'Authorization': `Admin ${localStorage.getItem('token')}` } 
    })
    .then(response => response.json())
    .catch(() => null);
    
    const { data: allUsers, mutate } = useSwr(`${BASE_API}/v${API_VERSION}/admin/users`, fetcher, { 
        revalidateIfStale: false, 
        revalidateOnFocus: false, 
        revalidateOnReconnect: false 
    });

    const createUser = async () => {
        const response = await fetch(`${BASE_API}/v${API_VERSION}/admin/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Admin ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                email,
                username,
                password,
                isAdmin
            })
        }).catch(() => null);

        if (!response) return toast.error('Create user', { description: 'Failed to create user. Try again.' });

        const json = await response.json().catch(() => null);

        if (response?.ok) {
            if (!json) return toast.error('Create user', { description: 'Failed to create user. Try again.' });

            mutate([...allUsers, json], { revalidate: false });
            setEmail('');
            setUsername('');
            setPassword('');
            setIsAdmin(false);

            toast.success('Create user', { description: 'Successfully created user.' });
        } else {
            toast.error('Create user', { description: json?.message || 'Failed to create user. Try again.' });
        }
    };

    async function deleteUser(userId) {
        const response = await fetch(`${BASE_API}/v${API_VERSION}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Admin ${localStorage.getItem('token')}`
            }
        }).catch(() => null);

        if (!response) return toast.error('Delete user', { description: 'Failed to delete user. Try again.' });

        if (response.ok) {
            mutate(allUsers.filter(u => u.id !== userId), { revalidate: false });
            
            toast.success('Delete user', { description: 'Successfully deleted user.' });
        } else {
            const json = await response.json().catch(() => null);
            toast.error('Delete user', { description: json?.message || 'Failed to delete user. Try again.' });
        }
    }

    async function toggleBanUser(userId, currentStatus) {
        const response = await fetch(`${BASE_API}/v${API_VERSION}/admin/users/${userId}/ban`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Admin ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                banned: !currentStatus
            })
        }).catch(() => null);

        if (!response) return toast.error('Update user', { description: 'Failed to update user status. Try again.' });

        if (response.ok) {
            mutate(allUsers.map(u => u.id === userId ? {...u, banned: !currentStatus} : u), { revalidate: false });
            
            toast.success('Update user', { 
                description: `Successfully ${!currentStatus ? 'banned' : 'unbanned'} user.` 
            });
        } else {
            const json = await response.json().catch(() => null);
            toast.error('Update user', { description: json?.message || 'Failed to update user status. Try again.' });
        }
    }

    async function updateUser(userId, updateData) {
        const response = await fetch(`${BASE_API}/v${API_VERSION}/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Admin ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(updateData)
        }).catch(() => null);

        if (!response) return toast.error('Update user', { description: 'Failed to update user. Try again.' });

        const json = await response.json().catch(() => null);

        if (response.ok) {
            if (!json) return toast.error('Update user', { description: 'Failed to update user. Try again.' });

            mutate(allUsers.map(u => u.id === userId ? {...u, ...json} : u), { revalidate: false });
            toast.success('Update user', { description: 'Successfully updated user.' });
        } else {
            toast.error('Update user', { description: json?.message || 'Failed to update user. Try again.' });
        }
    }

    const filteredUsers = !allUsers ? [] : allUsers.filter(user => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            user.username?.toLowerCase().includes(query) ||
            user.id?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="bg-[#0A1323] py-4 px-6 rounded-lg border border-[#1B2B4B]">
            <h2 className="text-xl md:text-2xl font-bold mb-4">Admin User Management</h2>
            
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                <AlertDialog>
                    <AlertDialogTrigger>
                        <Button className="w-full md:w-auto">Create User</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader className="mb-2">
                            <AlertDialogTitle>Create a new user</AlertDialogTitle>
                            <AlertDialogDescription>Create a user with username and password</AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label>Email</Label>
                                <Input 
                                    placeholder="Email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label>Username</Label>
                                <Input 
                                    placeholder="Username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label>Password</Label>
                                <Input 
                                    placeholder="Password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isAdmin"
                                    checked={isAdmin}
                                    onChange={(e) => setIsAdmin(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <Label htmlFor="isAdmin">Admin privileges</Label>
                            </div>
                        </div>
                        <AlertDialogFooter className="mt-4">
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction disabled={!(username && password)} onClick={createUser}>Create</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                
                <div className="relative w-full md:w-64">
                    <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
            </div>
            
            <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Total users: {filteredUsers.length}</p>
            </div>
            
            <UserManagementAdmin users={filteredUsers} deleteUser={deleteUser} toggleBanUser={toggleBanUser} updateUser={updateUser} fetcher={fetcher} />
        </div>
    );
}

function SubUsersDialog({ userId, username, fetcher }) {
    const { user } = useAuth();
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ username: '', password: '', appId: '' });
    
    const { data: subUsers, mutate } = useSwr(
        userId ? `${BASE_API}/v${API_VERSION}/subusers?ownerId=${userId}` : null,
        fetcher,
        { 
            revalidateIfStale: false, 
            revalidateOnFocus: false, 
            revalidateOnReconnect: false 
        }
    );

    const deleteSubUser = async (subUserId) => {
        try {
            const response = await fetch(`${BASE_API}/v${API_VERSION}/subusers/${subUserId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Admin ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                mutate(); 
            } else {
                console.error('Failed to delete sub-user');
            }
        } catch (error) {
            console.error('Error deleting sub-user:', error);
        }
    };

    const startEditing = (subUser) => {
        setEditingUser(subUser.id);
        setEditForm({
            username: subUser.username,
            password: '',
            appId: subUser.appId
        });
    };

    const cancelEditing = () => {
        setEditingUser(null);
        setEditForm({ username: '', password: '', appId: '' });
    };

    const updateSubUser = async (subUserId) => {
        try {
            const updateData = {};
            if (editForm.username) updateData.username = editForm.username;
            if (editForm.password) updateData.password = editForm.password;
            if (editForm.appId) updateData.appId = editForm.appId;

            const response = await fetch(`${BASE_API}/v${API_VERSION}/subusers/${subUserId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Admin ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                mutate();
                setEditingUser(null);
                setEditForm({ username: '', password: '', appId: '' });
                toast.success('Sub-user updated successfully');
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Failed to update sub-user');
            }
        } catch (error) {
            console.error('Error updating sub-user:', error);
            toast.error('Error updating sub-user');
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-blue-400 hover:text-blue-500 bg-[#1B2B4B] hover:bg-[#2C3B5B]"
                >
                    <Users className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-[#0A1323] border-[#1B2B4B]">
                <DialogHeader>
                    <DialogTitle className="text-white">Sub Users of {username}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                    List of sub users created by this user
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-6">
                    {subUsers && subUsers.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {subUsers.map((subUser) => (
                                <div key={subUser.id} className="p-4 bg-[#1B2B4B] rounded-lg border border-[#2C3B5B] hover:bg-[#2C3B5B] transition-colors">
                                    {editingUser === subUser.id ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <Label htmlFor="edit-username" className="text-white mb-2 block">Username</Label>
                                                    <Input
                                                        id="edit-username"
                                                        value={editForm.username}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                                                        className="bg-[#0A1323] border-[#2C3B5B] text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="edit-password" className="text-white mb-2 block">New Password (optional)</Label>
                                                    <Input
                                                        id="edit-password"
                                                        type="password"
                                                        value={editForm.password}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                                                        className="bg-[#0A1323] border-[#2C3B5B] text-white"
                                                        placeholder="Leave empty to keep current password"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="edit-appId" className="text-white mb-2 block">Application</Label>
                                                    <Select
                                                        value={editForm.appId}
                                                        onValueChange={(value) => setEditForm(prev => ({ ...prev, appId: value }))}
                                                    >
                                                        <SelectTrigger className="bg-[#0A1323] border-[#2C3B5B] text-white">
                                                            <SelectValue placeholder="Select an application" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-[#0A1323] border-[#2C3B5B]">
                                                            {user.applications?.map((app) => (
                                                                <SelectItem key={app.id} value={app.id} className="text-white hover:bg-[#2C3B5B]">
                                                                    {app.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    onClick={cancelEditing}
                                                    className="text-gray-400 hover:text-white bg-[#2C3B5B] hover:bg-[#3C4B6B]"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    onClick={() => updateSubUser(subUser.id)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                                >
                                                    Save
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium text-white mb-1">{subUser.username}</p>
                                                <p className="text-sm text-gray-400">App ID: <span className="font-mono text-blue-400">{subUser.appId}</span></p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-200">
                                                    Active
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => startEditing(subUser)}
                                                    className="text-blue-400 hover:text-blue-500 bg-blue-900/20 hover:bg-blue-900/30 h-8 w-8"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="text-red-400 hover:text-red-500 bg-red-900/20 hover:bg-red-900/30 h-8 w-8"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-[#0A1323] border-[#1B2B4B]">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-white">Delete sub user</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-gray-400">
                                                        Are you sure you want to delete the sub user “{subUser.username}”? This action is irreversible.                                                    
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="bg-[#1B2B4B] text-white border-[#2C3B5B] hover:bg-[#2C3B5B]">
                                                        Cancel
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction 
                                                        onClick={() => deleteSubUser(subUser.id)}
                                                        className="bg-red-600 hover:bg-red-700 text-white"
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Users className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                            <p className="text-gray-400 text-lg font-medium mb-2">No sub user</p>
                            <p className="text-gray-500 text-sm">This user has not created any secondary users</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function EditUserDialog({ user, updateUser }) {
    const [editForm, setEditForm] = useState({
        username: user.username || '',
        email: user.email || '',
        password: '',
        isAdmin: user.subscription?.plan === 'Admin' || false
    });
    const [isOpen, setIsOpen] = useState(false);

    const handleUpdate = async () => {
        const updateData = {};
        if (editForm.username !== user.username) updateData.username = editForm.username;
        if (editForm.email !== user.email) updateData.email = editForm.email;
        if (editForm.password) updateData.password = editForm.password;
        if (editForm.isAdmin !== (user.subscription?.plan === 'Admin')) {
            updateData.isAdmin = editForm.isAdmin;
        }

        if (Object.keys(updateData).length === 0) {
            toast.error('No changes detected');
            return;
        }

        await updateUser(user.id, updateData);
        setIsOpen(false);
        setEditForm({
            username: user.username || '',
            email: user.email || '',
            password: '',
            isAdmin: user.subscription?.plan === 'Admin' || false
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-blue-400 hover:text-blue-500 bg-[#1B2B4B] hover:bg-[#2C3B5B]"
                >
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0A1323] border-[#1B2B4B]">
                <DialogHeader>
                    <DialogTitle className="text-white">Edit User: {user.username}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Update user information and permissions
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-6">
                    <div className="flex flex-col gap-2">
                        <Label className="text-white">Username</Label>
                        <Input 
                            value={editForm.username}
                            onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                            className="bg-[#1B2B4B] border-[#2C3B5B] text-white"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label className="text-white">Email</Label>
                        <Input 
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                            className="bg-[#1B2B4B] border-[#2C3B5B] text-white"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label className="text-white">New Password (optional)</Label>
                        <Input 
                            type="password"
                            value={editForm.password}
                            onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="Leave empty to keep current password"
                            className="bg-[#1B2B4B] border-[#2C3B5B] text-white"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="editIsAdmin"
                            checked={editForm.isAdmin}
                            onChange={(e) => setEditForm(prev => ({ ...prev, isAdmin: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <Label htmlFor="editIsAdmin" className="text-white">Admin privileges</Label>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button
                        variant="ghost"
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 hover:text-white bg-[#2C3B5B] hover:bg-[#3C4B6B]"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpdate}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={!editForm.username || !editForm.email}
                    >
                        Update User
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

const UserManagementAdmin = ({ users, deleteUser, toggleBanUser, updateUser, fetcher }) => {
    const { user: currentUser } = useAuth();
    const columns = ["ID", "Username", "Subscription", "Status", "Created At", "Actions"];

    const data = !users || !Array.isArray(users) ? [] : users.map(({ id, username, subscription, banned, created_at }) => ({
        id,
        username,
        sub: (
            <Badge variant={
                subscription?.plan === 'Admin' ? 'default' :
                subscription?.plan === 'Founder' ? 'destructive' :
                'secondary'
            }>
                {subscription?.plan || 'User'}
            </Badge>
        ),
        status: banned ? (
            <Badge variant="destructive">
                Banned
            </Badge>
        ) : (
            <Badge variant="success">
                Active
            </Badge>
        ),
        createdAt: new Date(created_at).toLocaleDateString(),
        actions: (
            <div className="flex items-center gap-2 justify-start md:justify-end">
                <SubUsersDialog userId={id} username={username} fetcher={fetcher} />
                <EditUserDialog user={{ id, username, email: users.find(u => u.id === id)?.email, subscription }} updateUser={updateUser} />
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`${banned ? 'text-green-400 hover:text-green-500' : 'text-red-400 hover:text-red-500'} bg-[#1B2B4B] hover:bg-[#2C3B5B]`}
                    onClick={() => toggleBanUser(id, banned)}
                    disabled={currentUser?.id === id || subscription?.plan === 'Founder'}
                >
                    {banned ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-400 hover:text-red-500 bg-[#1B2B4B] hover:bg-[#2C3B5B]"
                            disabled={currentUser?.id === id}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
                        </AlertDialogHeader>
                        <p className="text-sm text-muted-foreground">
                            {currentUser?.id === id ? 
                                "You cannot delete your own account." :
                                `This action is irreversible. The user "${username}" will be permanently deleted.`
                            }
                        </p>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => deleteUser(id)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={currentUser?.id === id}
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        )
    }));

    return <TableManagement columns={columns} data={data} />;
};
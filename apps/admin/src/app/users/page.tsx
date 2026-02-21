"use client";

import { useState } from "react";
import { kkGet, kkPost, ApiError } from "@/lib/kobklein-api";
import { ApiUnavailableBanner } from "@/components/api-status-banner";
import { Card, CardContent } from "@kobklein/ui/card";
import { Button } from "@kobklein/ui/button";
import { Input } from "@kobklein/ui/input";
import { Badge } from "@kobklein/ui/badge";
import {
  Search,
  UserCog,
  ShieldCheck,
  ShieldX,
} from "lucide-react";

type UserResult = {
  id: string;
  kId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  role: string;
  kycTier: number;
  isFrozen: boolean;
};

export default function UsersPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [apiDown, setApiDown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [newRole, setNewRole] = useState("");
  const [roleMessage, setRoleMessage] = useState("");
  const [roleLoading, setRoleLoading] = useState(false);
  const [freezeLoading, setFreezeLoading] = useState<string | null>(null);
  const [freezeMessage, setFreezeMessage] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.length < 2) return;
    setSearching(true);
    setApiDown(false);
    try {
      const data = await kkGet<any>(`v1/admin/users/search?q=${encodeURIComponent(query)}`);
      setResults(data?.users || []);
    } catch (e: any) {
      if (e instanceof ApiError && e.isApiUnavailable) setApiDown(true);
      console.error("Search failed:", e);
    } finally {
      setSearching(false);
    }
  }

  async function refreshResults() {
    if (query.length >= 2) {
      const data = await kkGet<any>(`v1/admin/users/search?q=${encodeURIComponent(query)}`);
      setResults(data?.users || []);
    }
  }

  async function handleSetRole() {
    if (!selectedUser || !newRole) return;
    setRoleLoading(true);
    setRoleMessage("");
    try {
      await kkPost("v1/admin/users/set-role", {
        userId: selectedUser.id,
        role: newRole,
      });
      setRoleMessage(`Role updated to "${newRole}"`);
      await refreshResults();
      setSelectedUser(null);
    } catch (e: any) {
      setRoleMessage(`Error: ${e.message}`);
    } finally {
      setRoleLoading(false);
    }
  }

  async function handleFreeze(user: UserResult) {
    const newFrozen = !user.isFrozen;
    setFreezeLoading(user.id);
    setFreezeMessage("");
    try {
      await kkPost("v1/admin/users/freeze", {
        userId: user.id,
        frozen: newFrozen,
      });
      setFreezeMessage(
        newFrozen
          ? `Account for ${user.firstName} ${user.lastName} has been frozen`
          : `Account for ${user.firstName} ${user.lastName} has been unfrozen`
      );
      await refreshResults();
    } catch (e: any) {
      setFreezeMessage(`Error: ${e.message}`);
    } finally {
      setFreezeLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">User Management</h1>
        <p className="text-sm text-muted-foreground">Search users by K-ID, phone, handle, or name</p>
      </div>

      {apiDown && <ApiUnavailableBanner />}

      {/* Search */}
      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <form onSubmit={handleSearch} className="flex gap-3 items-end max-w-lg">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Search Users</label>
              <Input
                placeholder="K-ID, phone, @handle, or name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <Button type="submit" disabled={searching} className="gap-2">
              <Search className="h-4 w-4" />
              {searching ? "Searching..." : "Search"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((user) => (
            <Card key={user.id} className="rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {user.firstName} {user.lastName}
                      </span>
                      {user.kId && (
                        <span className="text-xs font-mono text-muted-foreground">{user.kId}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {user.phone && <span>{user.phone}</span>}
                      {user.email && <span>{user.email}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{user.role}</Badge>
                      <Badge variant={user.kycTier >= 2 ? "default" : "outline"}>
                        KYC {user.kycTier}
                      </Badge>
                      {user.isFrozen ? (
                        <Badge variant="destructive" className="gap-1">
                          <ShieldX className="h-3 w-3" /> Frozen
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <ShieldCheck className="h-3 w-3" /> Active
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">{user.id}</div>
                  </div>

                  <div className="flex gap-2">
                    {user.isFrozen ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={freezeLoading === user.id}
                        onClick={() => handleFreeze(user)}
                        className="gap-1 border-emerald-600 text-emerald-400 hover:bg-emerald-900/30 hover:text-emerald-300"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        {freezeLoading === user.id ? "Unfreezing..." : "Unfreeze"}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={freezeLoading === user.id}
                        onClick={() => handleFreeze(user)}
                        className="gap-1 border-red-600 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                      >
                        <ShieldX className="h-4 w-4" />
                        {freezeLoading === user.id ? "Freezing..." : "Freeze"}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setNewRole(user.role);
                        setRoleMessage("");
                      }}
                      className="gap-1"
                    >
                      <UserCog className="h-4 w-4" />
                      Change Role
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Freeze Feedback */}
      {freezeMessage && (
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <p className={`text-sm ${freezeMessage.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}>
              {freezeMessage}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Role Change Modal */}
      {selectedUser && (
        <Card className="rounded-2xl border-[#C9A84C]/30">
          <CardContent className="p-5">
            <h2 className="font-medium mb-3 flex items-center gap-2">
              <UserCog className="h-4 w-4 text-[#C9A84C]" />
              Change Role — {selectedUser.firstName} {selectedUser.lastName}
            </h2>
            <div className="flex gap-3 items-end max-w-md">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">New Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="client">Client</option>
                  <option value="diaspora">Diaspora</option>
                  <option value="merchant">Merchant</option>
                  <option value="distributor">Distributor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <Button onClick={handleSetRole} disabled={roleLoading} className="bg-[#C9A84C] hover:bg-[#E2CA6E] text-[#060D1F] font-semibold">
                {roleLoading ? "Saving..." : "Update Role"}
              </Button>
              <Button variant="ghost" onClick={() => setSelectedUser(null)}>Cancel</Button>
            </div>
            {roleMessage && (
              <p className={`mt-3 text-sm ${roleMessage.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}>
                {roleMessage}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

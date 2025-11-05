/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { showConfirm, SwalToast } from "@/components/SweetAlert";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import Loader from "@/components/ui/custom/loader";
import UserFormModal, { UserFormData } from "@/components/UserFormModal";
import { useEffect, useState } from "react";
import { FaEdit, FaSyncAlt, FaTrash } from "react-icons/fa";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export default function UserManagement() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [userDelete, setUserDelete] = useState({
    id: "",
    name: "",
    open: false,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        limit: limit.toString(),
      });
      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();

      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch (error) {
      SwalToast.fire({
        icon: "error",
        title: "Gagal mendapatkan data!",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const toggleSelect = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((user) => user.id));
    }
  };
  const handleActivate = async () => {
    if (selectedUsers.length === 0) return;

    const confirm = await showConfirm("Aktifkan user terpilih?", "question");
    if (!confirm) return;

    try {
      setLoading(true);
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          status: "ACTIVE",
        }),
      });
      const result = await res.json();

      if (res.ok) {
        SwalToast.fire({
          icon: "success",
          title: "User berhasil diaktifkan!",
        });
        fetchUsers();
        setSelectedUsers([]);
      } else {
        throw new Error(result.error || "Gagal mengaktifkan user");
      }
    } catch (err) {
      SwalToast.fire({
        icon: "error",
        title: "Terjadi kesalahan saat mengaktifkan user",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (selectedUsers.length === 0) return;

    const confirm = await showConfirm(
      "Nonaktifkan user terpilih?",
      "warning",
      true
    );
    if (!confirm) return;

    try {
      setLoading(true);
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          status: "SUSPEND",
        }),
      });

      const result = await res.json();

      if (res.ok) {
        SwalToast.fire({
          icon: "success",
          title: "User berhasil dinonaktifkan!",
        });
        fetchUsers();
        setSelectedUsers([]);
      } else {
        throw new Error(result.error || "Gagal menonaktifkan user");
      }
    } catch (err) {
      SwalToast.fire({
        icon: "error",
        title: "Terjadi kesalahan saat menonaktifkan user",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setSelectedUsers([]);
    await fetchUsers(); // fetch ulang data
  };

  const handleAddUser = () => {
    setModalMode("create");
    setEditUser(null);
    setModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setModalMode("edit");
    setEditUser(user);
    setModalOpen(true);
  };

  const handleSubmitUser = async (data: UserFormData) => {
    setLoading(true);
    try {
      const method = modalMode === "create" ? "POST" : "PUT";
      const url =
        modalMode === "create" ? "/api/users" : `/api/users/${data.id}`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        SwalToast.fire({
          icon: "success",
          title:
            modalMode === "create" ? "User ditambahkan!" : "User diperbarui!",
        });
        fetchUsers();
        setModalOpen(false);
      } else {
        throw new Error("Gagal menyimpan user");
      }
    } catch {
      SwalToast.fire({ icon: "error", title: "Gagal menyimpan user" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOne = async (userId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (res.ok) {
        SwalToast.fire({
          icon: "success",
          title: "User berhasil dihapus!",
        });
        fetchUsers();
      } else {
        throw new Error(result.error || "Gagal menghapus user");
      }
    } catch (err) {
      SwalToast.fire({
        icon: "error",
        title: "Terjadi kesalahan saat menghapus user",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-4 bg-background text-foreground min-h-screen transition-colors duration-200">
        <h2 className="text-xl font-semibold">User Management</h2>
        <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleAddUser}
              className="bg-primary text-primary-foreground px-4 py-1 rounded hover:bg-primary/90 w-full md:w-auto"
            >
              + Tambah User
            </button>
            {/* <button
              onClick={handleActivate}
              className="bg-primary text-white hover:bg-primary/90 px-4 py-1 rounded w-full md:w-auto"
            >
              Aktifkan
            </button>
            <button
              onClick={handleDeactivate}
              className="bg-popover text-popover-foreground px-4 py-1 rounded hover:bg-popover/90 w-full md:w-auto"
            >
              Nonaktifkan
            </button> */}
          </div>

          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <select
              title="selectPageLimit"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="border rounded px-2 py-1 bg-secondary text-secondary-foreground w-full md:w-auto"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <input
              type="text"
              placeholder="Search user..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="border rounded px-3 py-1 w-full md:w-64"
            />
            <button
              onClick={handleRefresh}
              className="bg-primary text-white px-3 py-1 rounded hover:bg-primary/90 flex items-center gap-1 w-full md:w-auto justify-center"
              title="Refresh data"
            >
              <FaSyncAlt />
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-border-color rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-muted">
              <tr className="text-left">
                <th className="px-4 py-2">
                  <input
                    title="checkBoxPackage"
                    type="checkbox"
                    checked={selectedUsers.length === users.length}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-border-color transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  <td className="px-4 py-2">
                    <input
                      title="checkBoxSelectedUser"
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleSelect(user.id)}
                    />
                  </td>
                  <td className="px-4 py-2">{user.name}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">{user.role}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded text-white text-xs ${
                        user.status === "ACTIVE"
                          ? "bg-green-600"
                          : user.status === "PENDING"
                          ? "bg-gray-500"
                          : "bg-gray-500"
                      }`}
                    >
                      {user.status === "ACTIVE"
                        ? "Aktif"
                        : user.status === "PENDING"
                        ? "Pending"
                        : "Suspend"}
                    </span>
                  </td>
                  <td className="px-4 py-2 flex items-center gap-2">
                    <button
                      title="Edit"
                      className="bg-primary text-primary-foreground p-2 rounded hover:bg-primary/90"
                      onClick={() => handleEditUser(user)}
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button
                      title="Hapus"
                      disabled={users.length === 1}
                      className="bg-destructive text-destructive-foreground p-2 rounded hover:bg-destructive/90"
                      onClick={() =>
                        setUserDelete({
                          id: user.id,
                          name: user.name,
                          open: true,
                        })
                      }
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="space-x-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="bg-muted px-3 py-1 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="bg-muted px-3 py-1 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      <Loader loading={loading} />
      <UserFormModal
        isOpen={modalOpen}
        loading={loading}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitUser}
        mode={modalMode}
        initialData={
          editUser
            ? {
                id: editUser.id,
                name: editUser.name,
                email: editUser.email,
                role: editUser.role,
                status: editUser.status,
              }
            : undefined
        }
      />
      <ConfirmDialog
        open={userDelete.open}
        onOpenChange={(change) =>
          setUserDelete((_prev) => ({ ..._prev, open: change }))
        }
        title="Hapus item?"
        description={
          <>
            Tindakan ini tidak bisa dibatalkan. Untuk mengkonfirmasi, ketik nama
            item persis.
          </>
        }
        // requiredText={userDelete.name}
        matchMode="iequals" // tidak case sensitive
        confirmLabel="Hapus"
        cancelLabel="Batal"
        tone="danger"
        onConfirm={() => handleDeleteOne(userDelete.id)}
      />
    </>
  );
}

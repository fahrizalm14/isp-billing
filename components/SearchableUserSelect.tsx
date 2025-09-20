import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserSelectProps {
  value?: string;
  onChange: (value: User) => void;
  disabled?: boolean;
}

export default function SearchableUserInput({
  onChange,
  disabled,
}: UserSelectProps) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchUsers = async () => {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        page: "1",
        limit: "10",
      });

      const res = await fetch(`/api/users?${params}`, {
        signal: controller.signal,
      });

      const data = await res.json();
      setUsers(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.users.map((_user: any) => ({
          id: _user.id,
          name: `${_user.name} (${_user.email})`,
        })) || []
      );
      setLoading(false);
    };

    if (search.length >= 2) {
      fetchUsers();
    } else {
      setUsers([]);
    }

    return () => controller.abort();
  }, [search]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    setSearch(inputVal);

    const matchedUser = users.find((user) => user.name === inputVal);
    if (matchedUser) {
      onChange(matchedUser);
    }
  };

  return (
    <div>
      <label htmlFor="user-search" className="block text-sm font-medium mb-1">
        Cari User
      </label>
      <input
        list="user-options"
        id="user-search"
        type="text"
        value={search}
        onChange={handleChange}
        placeholder="Ketik nama user..."
        disabled={disabled}
        className="w-full border px-3 py-2 rounded text-sm"
      />
      <datalist id="user-options">
        {users.map((user) => (
          <option key={user.id} value={user.name} />
        ))}
      </datalist>
      {loading && <p className="text-xs mt-1 text-gray-500">Loading...</p>}
    </div>
  );
}

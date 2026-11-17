import { useEffect, useState } from "react";
import { getUsers } from "./users.api";
import type { User } from "./users.types";

function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal mengambil data users"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <p>Memuat data users...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>Data Users</h1>

      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Mahasiswa</th>
            <th>Email</th>
            <th>ID Mahasiswa</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user, index) => (
            <tr key={user.uuid}>
              <td>{index + 1}</td>
              <td>{user.nama_mahasiswa}</td>
              <td>{user.email}</td>
              <td>{user.id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Users;
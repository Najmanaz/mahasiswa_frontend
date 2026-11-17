
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";
import Login from "./login";

type Mahasiswa = {
  id_mahasiswa: number;
  nim: string;
  nama_mahasiswa: string;
  jenis_kelamin: "L" | "P";
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  kelas: string | null;
  alamat: string | null;
  nama_ibu: string | null;
  no_hp: string | null;
  keterangan: string | null;
};

type FormMahasiswa = {
  id_mahasiswa: string;
  nim: string;
  nama_mahasiswa: string;
  jenis_kelamin: "L" | "P";
  tempat_lahir: string;
  tanggal_lahir: string;
  kelas: string;
  alamat: string;
  nama_ibu: string;
  no_hp: string;
  keterangan: string;
  email: string;
  password: string;
};

type Pagination = {
  currentPage: number;
  limit: number;
  totalData: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

const API_URL = "http://localhost:3000/api/v1/mahasiswa";
const PROFILE_URL = "http://localhost:3000/api/v1/users/me";
const ITEMS_PER_PAGE = 4;

const formAwal: FormMahasiswa = {
  id_mahasiswa: "",
  nim: "",
  nama_mahasiswa: "",
  jenis_kelamin: "L",
  tempat_lahir: "",
  tanggal_lahir: "",
  kelas: "",
  alamat: "",
  nama_ibu: "",
  no_hp: "",
  keterangan: "Aktif",
  email: "",
  password: "",
};

const paginationAwal: Pagination = {
  currentPage: 1,
  limit: ITEMS_PER_PAGE,
  totalData: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(sessionStorage.getItem("token"))
  );

  const [role] = useState(
    () => sessionStorage.getItem("role") || ""
  );

  const [halamanAktif, setHalamanAktif] = useState<
    "dashboard" | "mahasiswa"
  >("dashboard");

  const [mahasiswa, setMahasiswa] = useState<Mahasiswa[]>([]);
  const [profil, setProfil] = useState<Mahasiswa | null>(null);

  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState("Semua Kelas");

  const [currentPage, setCurrentPage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const page = Number(params.get("page") ?? 1);
    return Number.isInteger(page) && page > 0 ? page : 1;
  });

  const [pagination, setPagination] =
    useState<Pagination>(paginationAwal);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pesan, setPesan] = useState("");

  const [modalTambah, setModalTambah] = useState(false);
  const [form, setForm] = useState<FormMahasiswa>(formAwal);
  const [sedangMenyimpan, setSedangMenyimpan] = useState(false);

  // Header autentikasi menggunakan token dari Session Storage
  const getAuthHeaders = (): Record<string, string> => {
    const token = sessionStorage.getItem("token");

    return token
      ? { Authorization: `Bearer ${token}` }
      : {};
  };

  // Logout dan hapus informasi sesi
  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("nama_mahasiswa");
    sessionStorage.removeItem("uuid");

    setIsAuthenticated(false);
    setMahasiswa([]);
    setProfil(null);
    setPagination(paginationAwal);
    setModalTambah(false);
    setError("");
    setPesan("");
  };

  // Mengambil seluruh data mahasiswa khusus admin
  const ambilDataMahasiswa = async (page: number) => {
    try {
      if (!sessionStorage.getItem("token")) {
        logout();
        return;
      }

      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}?page=${page}&limit=${ITEMS_PER_PAGE}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.status === 401) {
        logout();
        return;
      }

      if (response.status === 403) {
        throw new Error("Akses hanya diperbolehkan untuk admin.");
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal mengambil data mahasiswa"
        );
      }

      setMahasiswa(result.data);
      setPagination(result.pagination);

      if (
        result.pagination.totalPages > 0 &&
        page > result.pagination.totalPages
      ) {
        setCurrentPage(result.pagination.totalPages);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Tidak dapat terhubung ke server"
      );
    } finally {
      setLoading(false);
    }
  };

  // Mengambil profil milik user yang sedang login
  const ambilProfilSaya = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(PROFILE_URL, {
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        logout();
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal mengambil profil mahasiswa"
        );
      }

      setProfil(result.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil profil"
      );
    } finally {
      setLoading(false);
    }
  };

  // Mengambil data berdasarkan role
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    if (role === "admin") {
      const params = new URLSearchParams(window.location.search);

      params.set("page", String(currentPage));
      params.set("limit", String(ITEMS_PER_PAGE));

      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${params.toString()}`
      );

      ambilDataMahasiswa(currentPage);
    } else if (role === "user") {
      ambilProfilSaya();
    } else {
      logout();
    }
  }, [currentPage, isAuthenticated, role]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const page = Number(params.get("page") ?? 1);

      setCurrentPage(
        Number.isInteger(page) && page > 0 ? page : 1
      );
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const kelasList = useMemo(() => {
    return Array.from(
      new Set(
        mahasiswa
          .map((siswa) => siswa.kelas)
          .filter((kelas): kelas is string => Boolean(kelas))
      )
    );
  }, [mahasiswa]);

  const filteredMahasiswa = useMemo(() => {
    return mahasiswa.filter((siswa) => {
      const cocokSearch =
        siswa.nama_mahasiswa
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        siswa.nim.toLowerCase().includes(search.toLowerCase()) ||
        String(siswa.id_mahasiswa).includes(search);

      const cocokKelas =
        filterKelas === "Semua Kelas" ||
        siswa.kelas === filterKelas;

      return cocokSearch && cocokKelas;
    });
  }, [mahasiswa, search, filterKelas]);

  const paginatedMahasiswa = filteredMahasiswa;

  const offset =
    (pagination.currentPage - 1) * ITEMS_PER_PAGE;

  const totalLaki = mahasiswa.filter(
    (siswa) => siswa.jenis_kelamin === "L"
  ).length;

  const totalPerempuan = mahasiswa.filter(
    (siswa) => siswa.jenis_kelamin === "P"
  ).length;

  // Tambah mahasiswa dan akun user khusus admin
  const tambahMahasiswa = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (
      !/^\d+$/.test(form.id_mahasiswa) ||
      Number(form.id_mahasiswa) <= 0
    ) {
      setError("ID Mahasiswa harus berupa angka yang valid.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    try {
      setSedangMenyimpan(true);
      setPesan("");
      setError("");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          ...form,
          id_mahasiswa: Number(form.id_mahasiswa),
          email: form.email.trim(),
          tempat_lahir: form.tempat_lahir || null,
          tanggal_lahir: form.tanggal_lahir || null,
          kelas: form.kelas || null,
          alamat: form.alamat || null,
          nama_ibu: form.nama_ibu || null,
          no_hp: form.no_hp || null,
          keterangan: form.keterangan || null,
        }),
      });

      if (response.status === 401) {
        logout();
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal menambahkan mahasiswa"
        );
      }

      setModalTambah(false);
      setForm(formAwal);
      setCurrentPage(1);
      setPesan(
        "Mahasiswa dan akun pengguna berhasil ditambahkan!"
      );

      await ambilDataMahasiswa(1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menambahkan mahasiswa"
      );
    } finally {
      setSedangMenyimpan(false);
    }
  };

  // Hapus mahasiswa khusus admin
  const hapusMahasiswa = async (
    id: number,
    nama: string
  ) => {
    const yakin = window.confirm(
      `Yakin ingin menghapus data mahasiswa ${nama}?`
    );

    if (!yakin) return;

    try {
      setError("");
      setPesan("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        logout();
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal menghapus mahasiswa"
        );
      }

      setPesan("Data mahasiswa berhasil dihapus!");

      await ambilDataMahasiswa(currentPage);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghapus mahasiswa"
      );
    }
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  // Tampilan khusus user/mahasiswa
  if (role === "user") {
    return (
      <div className="app-container">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-logo">S</div>
            <div>
              <h2>SchoolData</h2>
              <span>Student Portal</span>
            </div>
          </div>

          <div className="sidebar-bottom">
            <div className="admin-avatar">M</div>
            <div className="admin-info">
              <strong>
                {profil?.nama_mahasiswa || "Mahasiswa"}
              </strong>
              <span>Mahasiswa</span>
            </div>
            <button
              type="button"
              className="logout-button"
              onClick={logout}
            >
              logout
            </button>
          </div>
        </aside>

        <main className="main-content">
          <header className="topbar">
            <div>
              <p className="breadcrumb">Halaman / Profil</p>
              <h1>Profil Saya</h1>
            </div>
            <div className="profile-circle">M</div>
          </header>

          <section className="welcome-section">
            <div>
              <p className="eyebrow">STUDENT PORTAL</p>
              <h2>
                Selamat datang,{" "}
                {profil?.nama_mahasiswa || "Mahasiswa"}!
              </h2>
              <p>Berikut informasi data akademik milikmu.</p>
            </div>
            <div className="welcome-decoration">✦</div>
          </section>

          {loading ? (
            <p>Memuat profil mahasiswa...</p>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : profil ? (
            <section className="table-section">
              <div className="table-heading">
                <div>
                  <h2>Informasi Pribadi</h2>
                  <p>Data yang terdaftar pada SchoolData.</p>
                </div>
              </div>

              <div className="table-wrapper">
                <table>
                  <tbody>
                    <tr>
                      <th>ID Mahasiswa</th>
                      <td>{profil.id_mahasiswa}</td>
                    </tr>
                    <tr>
                      <th>NIM</th>
                      <td>{profil.nim}</td>
                    </tr>
                    <tr>
                      <th>Nama Lengkap</th>
                      <td>{profil.nama_mahasiswa}</td>
                    </tr>
                    <tr>
                      <th>Jenis Kelamin</th>
                      <td>
                        {profil.jenis_kelamin === "P"
                          ? "Perempuan"
                          : "Laki-laki"}
                      </td>
                    </tr>
                    <tr>
                      <th>Tempat Lahir</th>
                      <td>{profil.tempat_lahir || "-"}</td>
                    </tr>
                    <tr>
                      <th>Tanggal Lahir</th>
                      <td>{profil.tanggal_lahir || "-"}</td>
                    </tr>
                    <tr>
                      <th>Kelas</th>
                      <td>{profil.kelas || "-"}</td>
                    </tr>
                    <tr>
                      <th>Alamat</th>
                      <td>{profil.alamat || "-"}</td>
                    </tr>
                    <tr>
                      <th>Nama Ibu</th>
                      <td>{profil.nama_ibu || "-"}</td>
                    </tr>
                    <tr>
                      <th>Nomor HP</th>
                      <td>{profil.no_hp || "-"}</td>
                    </tr>
                    <tr>
                      <th>Keterangan</th>
                      <td>{profil.keterangan || "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <footer className="page-footer">
            © 2026 SchoolData Management System
          </footer>
        </main>
      </div>
    );
  }

  // Jika role tidak dikenal, jangan tampilkan dashboard admin
  if (role !== "admin") {
    return (
      <div className="login-page">
        <div className="login-card">
          <h2>Akses tidak tersedia</h2>
          <p>Silakan login kembali.</p>
          <button className="login-button" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  // Tampilan admin: fitur lama tetap dipertahankan
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">S</div>
          <div>
            <h2>SchoolData</h2>
            <span>Student Management</span>
          </div>
        </div>

        <p className="sidebar-label">MENU UTAMA</p>

        <nav className="sidebar-menu">
          <a
            href="#dashboard"
            className={`menu-item ${
              halamanAktif === "dashboard" ? "active" : ""
            }`}
            onClick={(e) => {
              e.preventDefault();
              setHalamanAktif("dashboard");
            }}
          >
            <span>▦</span> Dashboard
          </a>

          <a
            href="#mahasiswa"
            className={`menu-item ${
              halamanAktif === "mahasiswa" ? "active" : ""
            }`}
            onClick={(e) => {
              e.preventDefault();
              setHalamanAktif("mahasiswa");
            }}
          >
            <span>♙</span> Data Mahasiswa
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="admin-avatar">A</div>
          <div className="admin-info">
            <strong>Administrator</strong>
            <span>Admin Sistem</span>
          </div>
          <button
            type="button"
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <p className="breadcrumb">Halaman / Data Akademik</p>
            <h1>
              {halamanAktif === "dashboard"
                ? "Dashboard"
                : "Data Mahasiswa"}
            </h1>
          </div>

          <div className="topbar-right">
            <div className="date-label">
              Tahun Akademik 2026/2027
            </div>
            <div className="profile-circle">A</div>
          </div>
        </header>

        <section className="welcome-section">
          <div>
            <p className="eyebrow">STUDENT MANAGEMENT SYSTEM</p>
            <h2>Selamat datang, Administrator!</h2>
            <p>
              Kelola dan pantau seluruh data mahasiswa dengan mudah.
            </p>
          </div>
          <div className="welcome-decoration">✦</div>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon purple">♙</div>
            <div>
              <p>Total Mahasiswa</p>
              <h3>{pagination.totalData}</h3>
              <span>Data terdaftar</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon pink">♀</div>
            <div>
              <p>Mahasiswa Perempuan</p>
              <h3>{totalPerempuan}</h3>
              <span>Jenis kelamin P (halaman ini)</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue">♂</div>
            <div>
              <p>Mahasiswa Laki-laki</p>
              <h3>{totalLaki}</h3>
              <span>Jenis kelamin L (halaman ini)</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">▤</div>
            <div>
              <p>Total Kelas</p>
              <h3>{kelasList.length}</h3>
              <span>Kelas pada halaman ini</span>
            </div>
          </div>
        </section>

        <section className="table-section" id="mahasiswa">
          <div className="table-heading">
            <div>
              <h2>Daftar Mahasiswa</h2>
              <p>Informasi data mahasiswa yang terdaftar.</p>
            </div>

            <button
              className="add-button"
              type="button"
              onClick={() => {
                setForm(formAwal);
                setError("");
                setModalTambah(true);
              }}
            >
              + Tambah Mahasiswa
            </button>
          </div>

          {pesan && (
            <div className="success-message">{pesan}</div>
          )}

          {error && (
            <div className="error-message">{error}</div>
          )}

          <div className="table-toolbar">
            <div className="search-box">
              <span>⌕</span>
              <input
                type="text"
                placeholder="Cari ID, nama atau NIM..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
            >
              <option>Semua Kelas</option>
              {kelasList.map((kelas) => (
                <option key={kelas} value={kelas}>
                  {kelas}
                </option>
              ))}
            </select>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>No.</th>
                  <th>ID Mahasiswa</th>
                  <th>NIM</th>
                  <th>Nama Mahasiswa</th>
                  <th>Jenis Kelamin</th>
                  <th>Kelas</th>
                  <th>Nomor HP</th>
                  <th>Keterangan</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="empty-state">
                      Mengambil data mahasiswa...
                    </td>
                  </tr>
                ) : (
                  <>
                    {paginatedMahasiswa.map((siswa, index) => (
                      <tr key={siswa.id_mahasiswa}>
                        <td>{offset + index + 1}</td>
                        <td>{siswa.id_mahasiswa}</td>
                        <td className="nis-cell">{siswa.nim}</td>
                        <td className="name-cell">
                          {siswa.nama_mahasiswa}
                        </td>
                        <td>
                          <span
                            className={`gender-badge ${
                              siswa.jenis_kelamin === "P"
                                ? "female"
                                : "male"
                            }`}
                          >
                            {siswa.jenis_kelamin === "P"
                              ? "Perempuan"
                              : "Laki-laki"}
                          </span>
                        </td>
                        <td>{siswa.kelas || "-"}</td>
                        <td>{siswa.no_hp || "-"}</td>
                        <td>
                          <span className="status-badge">
                            {siswa.keterangan || "-"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="delete-button"
                            type="button"
                            onClick={() =>
                              hapusMahasiswa(
                                siswa.id_mahasiswa,
                                siswa.nama_mahasiswa
                              )
                            }
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}

                    {paginatedMahasiswa.length === 0 && (
                      <tr>
                        <td colSpan={9} className="empty-state">
                          Data mahasiswa tidak ditemukan.
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {!loading && pagination.totalPages > 0 && (
            <div className="pagination-container">
              <button
                type="button"
                className="pagination-button"
                disabled={!pagination.hasPreviousPage}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </button>

              {Array.from(
                { length: pagination.totalPages },
                (_, index) => index + 1
              ).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`pagination-button ${
                    currentPage === page
                      ? "pagination-active"
                      : ""
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className="pagination-button"
                disabled={!pagination.hasNextPage}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          )}

          <div className="table-footer">
            <span>
              Menampilkan{" "}
              <strong>
                {pagination.totalData === 0 ? 0 : offset + 1}
                {"–"}
                {Math.min(
                  offset + mahasiswa.length,
                  pagination.totalData
                )}
              </strong>{" "}
              dari <strong>{pagination.totalData}</strong> mahasiswa
            </span>

            <span className="mock-label">
              Data terhubung melalui API
            </span>
          </div>
        </section>

        <footer className="page-footer">
          © 2026 SchoolData Management System
        </footer>
      </main>

      {modalTambah && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!sedangMenyimpan) setModalTambah(false);
          }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <h2>Tambah Mahasiswa</h2>
                <p>
                  Lengkapi data mahasiswa dan akun pengguna.
                </p>
              </div>

              <button
                className="modal-close"
                type="button"
                onClick={() => setModalTambah(false)}
                disabled={sedangMenyimpan}
              >
                ×
              </button>
            </div>

            <form onSubmit={tambahMahasiswa}>
              <div className="form-grid">
                <label>
                  ID Mahasiswa *
                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={form.id_mahasiswa}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        id_mahasiswa: e.target.value,
                      })
                    }
                    placeholder="Contoh: 202606"
                  />
                </label>

                <label>
                  NIM *
                  <input
                    required
                    value={form.nim}
                    onChange={(e) =>
                      setForm({ ...form, nim: e.target.value })
                    }
                    placeholder="Masukkan NIM"
                  />
                </label>

                <label>
                  Nama Mahasiswa *
                  <input
                    required
                    value={form.nama_mahasiswa}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        nama_mahasiswa: e.target.value,
                      })
                    }
                    placeholder="Masukkan nama lengkap"
                  />
                </label>

                <label>
                  Jenis Kelamin *
                  <select
                    value={form.jenis_kelamin}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        jenis_kelamin: e.target.value as "L" | "P",
                      })
                    }
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </label>

                <label>
                  Email Akun *
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="contoh@email.com"
                  />
                </label>

                <label>
                  Password Akun *
                  <input
                    required
                    type="password"
                    minLength={8}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="Minimal 8 karakter"
                  />
                </label>

                <label>
                  Tempat Lahir
                  <input
                    value={form.tempat_lahir}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        tempat_lahir: e.target.value,
                      })
                    }
                    placeholder="Contoh: Jakarta"
                  />
                </label>

                <label>
                  Tanggal Lahir
                  <input
                    type="date"
                    value={form.tanggal_lahir}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        tanggal_lahir: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Kelas
                  <input
                    value={form.kelas}
                    onChange={(e) =>
                      setForm({ ...form, kelas: e.target.value })
                    }
                    placeholder="Masukkan kelas"
                  />
                </label>

                <label>
                  Nama Ibu
                  <input
                    value={form.nama_ibu}
                    onChange={(e) =>
                      setForm({ ...form, nama_ibu: e.target.value })
                    }
                    placeholder="Masukkan nama ibu"
                  />
                </label>

                <label>
                  Nomor HP
                  <input
                    value={form.no_hp}
                    onChange={(e) =>
                      setForm({ ...form, no_hp: e.target.value })
                    }
                    placeholder="Masukkan nomor HP"
                  />
                </label>

                <label className="full-width">
                  Alamat
                  <textarea
                    value={form.alamat}
                    onChange={(e) =>
                      setForm({ ...form, alamat: e.target.value })
                    }
                    placeholder="Masukkan alamat lengkap"
                  />
                </label>

                <label className="full-width">
                  Keterangan
                  <input
                    value={form.keterangan}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        keterangan: e.target.value,
                      })
                    }
                    placeholder="Contoh: Aktif"
                  />
                </label>
              </div>

              <p className="form-note">
                * Wajib diisi. Email dan password digunakan untuk
                membuat akun pengguna mahasiswa.
              </p>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setModalTambah(false)}
                  disabled={sedangMenyimpan}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="save-button"
                  disabled={sedangMenyimpan}
                >
                  {sedangMenyimpan
                    ? "Menyimpan..."
                    : "Simpan Mahasiswa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;


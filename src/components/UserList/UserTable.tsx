"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import Cookies from "js-cookie";
import {
  ChevronLeft,
  ChevronRight,
  SearchIcon,
  PointerUp,
  ChevronUpIcon,
} from "@/assets/icons";
import ColumnFilter from "../DataTables/ColumnFilter";
import { Modal } from "../Modal/Modal";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { useRef } from "react";


const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface User {
  id: number;
  full_name: string;
  username: string;
  email: string | null;
  phone: string | null;
  cnic: string | null;
  role: string;
  status: string;
  bio: string;
  image: string;
  coverImage: string;
  permissions: Record<string, any> | null;
  password?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component – matched to OrderList UI style
// ─────────────────────────────────────────────────────────────────────────────

const UsersTable = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "id", desc: true },
  ]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [createOrderPermission, setCreateOrderPermission] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      setCoverPreview('')
      setImagePreview('')
    };
  }, [editModalOpen]);



  // ── Data Fetching ───────────────────────────────────────────────────────────

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("auth_token");
      if (!token) return;

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: globalFilter.trim(),
        sortBy: sorting[0]?.id || "id",
        sortDir: sorting[0]?.desc ? "desc" : "asc",
      });

      columnFilters.forEach((f) => {
        if (f.id && f.value) params.append(f.id, String(f.value));
      });

      const res = await fetch(`${BACKEND_URL}/api/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Fetch failed");
      const json = await res.json();
      if (json.success && json.data?.users) {
        setUsers(json.data.users);
        setPagination(json.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit, globalFilter, columnFilters, sorting]);

  // ── Columns ─────────────────────────────────────────────────────────────────

  const columns: ColumnDef<User>[] = [
    { accessorKey: "full_name", header: "Full Name", enableColumnFilter: true },
    { accessorKey: "username", header: "Username", enableColumnFilter: true },
    { accessorKey: "email", header: "Email", enableColumnFilter: true },
    { accessorKey: "phone", header: "Phone", enableColumnFilter: true },
    { accessorKey: "cnic", header: "CNIC", enableColumnFilter: true },
    { accessorKey: "role", header: "Role", enableColumnFilter: true },
    { accessorKey: "status", header: "Status", enableColumnFilter: true },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => {
        const user = row.original;

        const [isOpen, setIsOpen] = useState(false);
        const [position, setPosition] = useState({ top: 0, left: 0 });
        const [openUp, setOpenUp] = useState(false);

        const triggerRef = useRef<HTMLButtonElement | null>(null);
        const dropdownRef = useRef<HTMLDivElement | null>(null);

        const toggleDropdown = () => {
          if (!triggerRef.current) return;

          const rect = triggerRef.current.getBoundingClientRect();
          const dropdownWidth = 176;
          const dropdownHeight = 150;

          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceRight = window.innerWidth - rect.right;

          const shouldOpenUp = spaceBelow < dropdownHeight;
          const shouldAlignLeft = spaceRight < dropdownWidth;

          setOpenUp(shouldOpenUp);

          setPosition({
            top: shouldOpenUp
              ? rect.top + window.scrollY - 8
              : rect.bottom + window.scrollY + 6,
            left: shouldAlignLeft
              ? rect.left + window.scrollX
              : rect.right + window.scrollX - dropdownWidth,
          });

          setIsOpen((prev) => !prev);
        };

        // ✅ Proper outside click + ESC support
        useEffect(() => {
          const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;

            if (
              triggerRef.current &&
              !triggerRef.current.contains(target) &&
              dropdownRef.current &&
              !dropdownRef.current.contains(target)
            ) {
              setIsOpen(false);
            }
          };

          const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
              setIsOpen(false);
            }
          };

          if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleEscape);
          }

          return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
          };
        }, [isOpen]);

        return (
          <>
            <button
              ref={triggerRef}
              onClick={toggleDropdown}
              className="group flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-dark shadow-[0_1px_3px_0_rgba(166,175,195,0.4)] hover:text-[#ff3d3d] dark:border dark:border-dark-3 dark:text-white dark:shadow-none"
            >
              <span>Actions</span>
              <ChevronUpIcon
                className={`size-4 transition-transform ${isOpen ? "rotate-0" : "rotate-180"
                  }`}
              />
            </button>

            {isOpen &&
              createPortal(
                <div
                  ref={dropdownRef}
                  style={{
                    position: "absolute",
                    top: position.top,
                    left: position.left,
                    transform: openUp ? "translateY(-100%)" : "none",
                  }}
                  className="z-[99999] w-44 rounded-md border border-stroke bg-white shadow-xl dark:border-dark-3 dark:bg-gray-900"
                >
                  <ul className="overflow-hidden text-sm font-medium text-current">
                    <li>
                      <button
                        onClick={() => {
                          handleEdit(user);
                          setIsOpen(false);
                        }}
                        className="block w-full px-4 py-2.5 text-left hover:bg-[#F5F7FD] hover:text-[#ff3d3d] dark:hover:bg-dark-3 dark:hover:text-neutral-50"
                      >
                        Edit
                      </button>
                    </li>

                    <li>
                      <button
                        onClick={() => {
                          handleDelete(user.id);
                          setIsOpen(false);
                        }}
                        className="block w-full px-4 py-2.5 text-left hover:bg-[#F5F7FD] hover:text-[#ff3d3d] dark:hover:bg-dark-3 dark:hover:text-neutral-50"
                      >
                        Delete
                      </button>
                    </li>

                    <li>
                      <button
                        onClick={() => {
                          handlePermissions(user);
                          setIsOpen(false);
                        }}
                        className="block w-full px-4 py-2.5 text-left hover:bg-[#F5F7FD] hover:text-[#ff3d3d] dark:hover:bg-dark-3 dark:hover:text-neutral-50"
                      >
                        Permissions
                      </button>
                    </li>
                  </ul>
                </div>,
                document.body
              )}
          </>
        );
      },
    }
  ];

  const table = useReactTable({
    data: users,
    columns,
    state: {
      globalFilter,
      columnFilters,
      sorting,
      pagination: {
        pageIndex: pagination.page - 1,
        pageSize: pagination.limit,
      },
    },
    pageCount: pagination.totalPages,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const newState =
        typeof updater === "function"
          ? updater({
            pageIndex: pagination.page - 1,
            pageSize: pagination.limit,
          })
          : updater;
      setPagination((prev) => ({
        ...prev,
        page: newState.pageIndex + 1,
        limit: newState.pageSize,
      }));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // ── Action Handlers ─────────────────────────────────────────────────────────

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({ ...user });
    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedUser?.id) return;
    setIsSubmitting(true);

    try {
      const token = Cookies.get("auth_token");

      // Create FormData instead of JSON
      const formDataToSend = new FormData();

      // Add all regular text / select / textarea fields
      Object.entries(formData).forEach(([key, value]) => {
        // Skip file objects — we add them separately below
        if (key === "imageFile" || key === "coverImageFile") return;

        // Only append if value is defined and not null/undefined
        if (value !== undefined && value !== null) {
          formDataToSend.append(key, String(value)); // convert numbers/booleans to string
        }
      });

      // Add files if they were selected
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      if (formData.coverImage) {
        formDataToSend.append("coverImage", formData.coverImage);
      }

      const res = await fetch(
        `${BACKEND_URL}/api/users/${selectedUser.id}/edit`,
        {
          method: "PATCH",
          headers: {
            // IMPORTANT: Do NOT set Content-Type manually
            // Browser will set multipart/form-data + correct boundary automatically
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Update failed");
      }

      await fetchUsers();
      setEditModalOpen(false);

      // Optional: show success message / toast
      // alert("User updated successfully!");
    } catch (err: any) {
      console.error("Update error:", err);
      // Optional: show error to user
      alert(err.message || "Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    setSelectedUser({ id } as User);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser?.id) return;
    setIsSubmitting(true);
    try {
      const token = Cookies.get("auth_token");
      const res = await fetch(`${BACKEND_URL}/api/users/${selectedUser.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchUsers();
      setDeleteModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePermissions = (user: User) => {
    setSelectedUser(user);
    setCreateOrderPermission(user.permissions?.create_order ?? false);
    setPermissionsModalOpen(true);
  };

  const updatePermissions = async () => {
    if (!selectedUser?.id) return;
    setIsSubmitting(true);
    try {
      const token = Cookies.get("auth_token");
      const res = await fetch(
        `${BACKEND_URL}/api/users/${selectedUser.id}/permissions`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            permissions_json: { create_order: createOrderPermission },
          }),
        },
      );
      if (!res.ok) throw new Error("Permissions update failed");
      await fetchUsers();
      setPermissionsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update permissions");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File size should be less than 2MB");
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setFormData((prev) => ({
      ...prev,
      [e.target.name]: file, // for backend
    }));

    if (e.target.name === "image") {
      setImagePreview(previewUrl);
    }

    if (e.target.name === "coverImage") {
      setCoverPreview(previewUrl);
    }
  };


  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <section className="data-table-common rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
      {/* Top bar – matched exactly */}
      <div className="flex justify-between px-7.5 py-4.5">
        <div className="relative z-20 w-full max-w-[414px]">
          <input
            type="text"
            value={globalFilter || ""}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="w-full rounded-lg border border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-[#ff3d3d]"
            placeholder="Search here..."
          />
          <button className="absolute right-0 top-0 flex h-11.5 w-11.5 items-center justify-center rounded-r-md bg-[#ff3d3d] text-white">
            <SearchIcon className="size-4.5" />
          </button>
        </div>

        <div className="flex items-center font-medium">
          <p className="pl-2 font-medium text-dark dark:text-current">
            Per Page:
          </p>
          <select
            value={pagination.limit}
            onChange={(e) =>
              setPagination((p) => ({
                ...p,
                limit: Number(e.target.value),
                page: 1,
              }))
            }
            className="bg-transparent pl-2.5"
          >
            {[5, 10, 15, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table – matched structure & styling */}
      <div className="grid grid-cols-1 overflow-x-auto">
        <table className="datatable-table datatable-one !border-collapse px-4 md:px-8">
          <thead className="border-separate px-4">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                className="border-t border-stroke dark:border-dark-3"
                key={headerGroup.id}
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="whitespace-nowrap px-3 py-4 align-top"
                  >
                    <div className="flex min-h-[70px] flex-col">
                      {/* Header + sort icons */}
                      <div
                        className="flex cursor-pointer items-center"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span className="font-[500]">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </span>
                        {header.column.getCanSort() && (
                          <div className="ml-2 inline-flex flex-col">
                            <PointerUp className="size-2.5" />
                            <PointerUp className="size-2.5 rotate-180" />
                          </div>
                        )}
                      </div>

                      {/* Column filter */}
                      {header.column.getCanFilter() &&
                        header.column.id !== "actions" && (
                          <div className="mt-2">
                            <ColumnFilter
                              column={{
                                filterValue:
                                  header.column.getFilterValue() as string,
                                setFilter: header.column.setFilterValue,
                              }}
                            />
                          </div>
                        )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <Loader text="Loading users..." />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  No users found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  className="border-t border-stroke dark:border-dark-3"
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="truncate px-3 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination – matched exactly */}
      <div className="flex items-center justify-between px-7.5 py-7">
        <div className="flex items-center">
          <button
            className="flex items-center justify-center rounded-[3px] p-[7px] hover:bg-[#ff3d3d] hover:text-white disabled:pointer-events-none"
            onClick={() =>
              setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
            }
            disabled={pagination.page === 1 || loading}
          >
            <ChevronLeft width={18} height={18} />
          </button>

          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPagination((p) => ({ ...p, page: pageNum }))}
                className={cn(
                  "mx-1 flex items-center justify-center rounded-[3px] p-1.5 px-[15px] font-medium hover:bg-[#ff3d3d] hover:bg-opacity-90 hover:text-white",
                  pagination.page === pageNum && "bg-[#ff3d3d] text-white",
                  loading && "pointer-events-none opacity-50",
                )}
                disabled={loading}
              >
                {pageNum}
              </button>
            ),
          )}

          <button
            className="flex items-center justify-center rounded-[3px] p-[7px] hover:bg-[#ff3d3d] hover:text-white disabled:pointer-events-none"
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            disabled={pagination.page >= pagination.totalPages || loading}
          >
            <ChevronRight width={18} height={18} />
          </button>
        </div>

        <p className="font-medium">
          Showing {pagination.page} of {pagination.totalPages} pages
        </p>
      </div>

      {/* ── Modals (kept your logic, matched OrderList styling) ── */}

      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        className="max-h-[90vh] w-full max-w-[700px] overflow-y-auto rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800"
      >
        <h2 className="mb-6 text-2xl font-bold text-dark dark:text-white">
          Edit User
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="full_name"
              className="mb-1.5 block text-sm font-medium text-dark dark:text-gray-300"
            >
              Full Name
            </label>
            <input
              id="full_name"
              name="full_name"
              value={formData.full_name || ""}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3 dark:bg-dark-2"
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm font-medium text-dark dark:text-gray-300"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              value={formData.username || ""}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3 dark:bg-dark-2"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-dark dark:text-gray-300"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              value={formData.email || ""}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3 dark:bg-dark-2"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-1.5 block text-sm font-medium text-dark dark:text-gray-300"
            >
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              value={formData.phone || ""}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3 dark:bg-dark-2"
            />
          </div>

          <div>
            <label
              htmlFor="cnic"
              className="mb-1.5 block text-sm font-medium text-dark dark:text-gray-300"
            >
              CNIC
            </label>
            <input
              id="cnic"
              name="cnic"
              value={formData.cnic || ""}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3 dark:bg-dark-2"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="mb-1.5 block text-sm font-medium text-dark dark:text-gray-300"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status || "active"}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3 dark:bg-dark-2"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Password field removed - OTP based login */}

          <div className="md:col-span-2">
            <label
              htmlFor="bio"
              className="mb-1.5 block text-sm font-medium text-dark dark:text-gray-300"
            >
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio || ""}
              onChange={handleInputChange}
              rows={4}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3 dark:bg-dark-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-gray-300">
              Cover Picture
            </label>
            <div className="flex items-center justify-center gap-2">
              {/* Current avatar preview */}
              <div className="h-20 w-40 overflow-hidden border border-stroke dark:border-dark-3">
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                  />
                ) : formData.coverImage ? (
                  <img
                    src={formData.coverImage}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400 dark:bg-dark-3">
                    No photo
                  </div>
                )}
              </div>

              {/* Upload controls */}
              <div>
                <label
                  htmlFor="coverImage"
                  className="inline-flex cursor-pointer items-center justify-center rounded-md border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-gray-300 dark:hover:bg-dark-3"
                >
                  Upload new picture
                </label>
                <input
                  id="coverImage"
                  name="coverImage"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  JPG, PNG or WEBP • Max 2MB
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-gray-300">
              Profile Picture
            </label>
            <div className="flex items-center justify-center gap-4">
              {/* Current avatar preview */}
              <div className="h-20 w-20 overflow-hidden rounded-full border border-stroke dark:border-dark-3">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : formData.image ? (
                  <img
                    src={formData.image}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400 dark:bg-dark-3">
                    No photo
                  </div>
                )}
              </div>

              {/* Upload controls */}
              <div>
                <label
                  htmlFor="image"
                  className="inline-flex cursor-pointer items-center justify-center rounded-md border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-gray-300 dark:hover:bg-dark-3"
                >
                  Upload new picture
                </label>
                <input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  JPG, PNG or WEBP • Max 2MB
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={() => setEditModalOpen(false)}
            disabled={isSubmitting}
            className="rounded border border-stroke px-6 py-2.5 text-dark hover:bg-gray-100 disabled:opacity-50 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={isSubmitting}
            className="rounded bg-[#ff3d3d] px-6 py-2.5 text-white hover:bg-[#ff3d3d]/90 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </Modal>

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        className="max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800"
      >
        <h2 className="mb-4 text-xl font-semibold text-dark dark:text-white">
          Confirm Deletion
        </h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Are you sure you want to delete this user? This action cannot be
          undone.
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={() => setDeleteModalOpen(false)}
            disabled={isSubmitting}
            className="rounded border border-stroke px-6 py-2.5 text-dark hover:bg-gray-100 disabled:opacity-50 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            disabled={isSubmitting}
            className="rounded bg-[#ff3d3d] px-6 py-2.5 text-white hover:bg-[#ff3d3d]/90 disabled:opacity-50"
          >
            {isSubmitting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </Modal>

      <Modal
        open={permissionsModalOpen}
        onClose={() => setPermissionsModalOpen(false)}
        className="max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800"
      >
        <h2 className="mb-4 text-xl font-semibold text-dark dark:text-white">
          User Permissions
        </h2>
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-dark dark:text-gray-300">Create Order</label>
            <input
              type="checkbox"
              checked={createOrderPermission}
              onChange={(e) => setCreateOrderPermission(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-[#ff3d3d] focus:ring-[#ff3d3d]"
            />
          </div>
        </div>
        <div className="flex justify-end gap-4">
          <button
            onClick={() => setPermissionsModalOpen(false)}
            disabled={isSubmitting}
            className="rounded border border-stroke px-6 py-2.5 text-dark hover:bg-gray-100 disabled:opacity-50 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
          >
            Cancel
          </button>
          <button
            onClick={updatePermissions}
            disabled={isSubmitting}
            className="rounded bg-[#ff3d3d] px-6 py-2.5 text-white hover:bg-[#ff3d3d]/90 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Permissions"}
          </button>
        </div>
      </Modal>
    </section >
  );
};

export default UsersTable;

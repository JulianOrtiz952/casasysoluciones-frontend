'use client';

import { useState, useEffect } from 'react';

// Decodificador manual de JWT
function parseJwt(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [rolActual, setRolActual] = useState('SUPER');
    const [editando, setEditando] = useState<any>(null);
    const [mostrarModal, setMostrarModal] = useState(false);

    // Formulario
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rol, setRol] = useState('OPERARIO');
    const [cargando, setCargando] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        // Obtenemos el rol del localStorage de haber hecho un login real
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = parseJwt(token);
            if (decoded && decoded.rol) {
                setRolActual(decoded.rol);
            }
        }
        fetchUsuarios();
    }, []);

    const fetchUsuarios = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/'}usuarios/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setUsuarios(data);
            }
        } catch (error) {
            console.error("Error cargando usuarios:", error);
        }
    };

    const handleGuardar = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setCargando(true);
        try {
            const payload: any = { username, rol };
            if (!editando || password) {
                payload.password = password; // Se envía password para crear o si quiere actualizarla
            }

            const method = editando ? 'PATCH' : 'POST';
            const url = editando
                ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/'}usuarios/${editando.id}/`
                : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/'}usuarios/`;

            const token = localStorage.getItem('token');
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                await fetchUsuarios();
                setMostrarModal(false);
            } else {
                const errData = await res.json();
                setErrorMsg(JSON.stringify(errData));
            }
        } catch (error) {
            setErrorMsg("Error de conexión");
        }
        setCargando(false);
    };

    const handleEliminar = async (id: number) => {
        if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/'}usuarios/${id}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                fetchUsuarios();
            }
        } catch (error) {
            console.error("Error al eliminar", error);
        }
    };

    const abrirModificacion = (user: any) => {
        setEditando(user);
        setUsername(user.username);
        setRol(user.role_display || 'OPERARIO');
        setPassword('');
        setErrorMsg('');
        setMostrarModal(true);
    };

    const abrirCreacion = () => {
        setEditando(null);
        setUsername('');
        setRol('OPERARIO');
        setPassword('');
        setErrorMsg('');
        setMostrarModal(true);
    };

    if (rolActual !== 'SUPER') {
        return (
            <div className="flex items-center justify-center h-64 text-slate-500">
                <h2>No tienes permisos de SuperAdmin para ver esta página.</h2>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Gestión de Usuarios</h1>
                <button
                    onClick={abrirCreacion}
                    className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg font-medium shadow transition"
                >
                    + Nuevo Usuario
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-sm">Usuario</th>
                            <th className="px-6 py-4 font-semibold text-sm">Rol</th>
                            <th className="px-6 py-4 font-semibold text-sm text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {usuarios.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                                <td className="px-6 py-4 text-slate-800 dark:text-white font-medium">{u.username}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${u.role_display === 'SUPER' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                                        : u.role_display === 'ADMIN' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                        }`}>
                                        {u.role_display || 'OPERARIO'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-3">
                                    <button onClick={() => abrirModificacion(u)} className="text-sky-500 hover:text-sky-600 font-medium">Editar</button>
                                    <button onClick={() => handleEliminar(u.id)} className="text-rose-500 hover:text-rose-600 font-medium">Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {mostrarModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                                {editando ? 'Editar Usuario' : 'Crear Usuario'}
                            </h3>

                            {errorMsg && <div className="p-3 mb-4 bg-rose-50 text-rose-600 rounded-lg text-sm">{errorMsg}</div>}

                            <form onSubmit={handleGuardar} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre de Usuario</label>
                                    <input
                                        type="text" required
                                        value={username} onChange={e => setUsername(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-rose-400 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Contraseña {editando && <span className="text-slate-400 font-normal">(Dejar en blanco para no cambiar)</span>}
                                    </label>
                                    <input
                                        type="password" required={!editando}
                                        value={password} onChange={e => setPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-rose-400 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rol del Sistema</label>
                                    <select
                                        value={rol} onChange={e => setRol(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-rose-400 dark:text-white"
                                    >
                                        <option value="SUPER">Súper Administrador</option>
                                        <option value="ADMIN">Administrador</option>
                                        <option value="OPERARIO">Operario Básico</option>
                                    </select>
                                </div>
                                <div className="pt-4 flex justify-end space-x-3">
                                    <button
                                        type="button" onClick={() => setMostrarModal(false)}
                                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg font-medium transition"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit" disabled={cargando}
                                        className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition shadow-md"
                                    >
                                        {cargando ? 'Guardando...' : 'Guardar Datos'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

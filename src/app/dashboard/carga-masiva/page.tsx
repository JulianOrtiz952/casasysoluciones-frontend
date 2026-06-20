'use client';

import { useState, useRef } from 'react';
import { useAlert } from '@/app/alert-provider';
import { 
    Download, 
    UploadCloud, 
    CheckCircle2, 
    AlertTriangle, 
    FileText, 
    X, 
    RefreshCw, 
    FileSpreadsheet, 
    ChevronRight,
    Check
} from 'lucide-react';

interface ValidationError {
    row: number;
    field: string;
    message: string;
}

interface PreviewItem {
    row: number;
    direccion?: string;
    propietario?: string;
    tipo?: string;
    estado?: string;
    precio?: number;
    email?: string;
    nombre?: string;
    documento?: string;
    rol?: string;
}

interface ValidationReport {
    success: boolean;
    summary: {
        total_rows: number;
        valid_rows: number;
        errors_count: number;
    };
    errors: ValidationError[];
    preview: PreviewItem[];
}

export default function CargaMasivaPage() {
    const { showAlert, showConfirm } = useAlert();
    const [activeTab, setActiveTab] = useState<'properties' | 'users'>('properties');
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState<boolean>(false);
    const [validating, setValidating] = useState<boolean>(false);
    const [importing, setImporting] = useState<boolean>(false);
    const [report, setReport] = useState<ValidationReport | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setFile(null);
        setReport(null);
        setSuccessMessage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleTabChange = (tab: 'properties' | 'users') => {
        setActiveTab(tab);
        resetState();
    };

    // Download dynamic Excel Template or current DB records Export
    const handleDownload = async (endpoint: 'template' | 'export') => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('token');
            
            const res = await fetch(`${API_URL}/api/v1/admin/bulk-upload/${endpoint}/?type=${activeTab}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Error al ejecutar la acción de ${endpoint}`);
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = endpoint === 'template'
                ? `plantilla_${activeTab === 'properties' ? 'inmuebles' : 'usuarios'}.xlsx`
                : `exportacion_${activeTab === 'properties' ? 'inmuebles' : 'usuarios'}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            
            showAlert(`Descarga de ${endpoint === 'template' ? 'plantilla' : 'exportación'} completada con éxito.`, 'success');
        } catch (error: any) {
            console.error(error);
            showAlert(error.message || 'Error en la conexión con el servidor.');
        }
    };

    // Handle Drag & Drop styling
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.name.endsWith('.xlsx')) {
                setFile(droppedFile);
                validateFile(droppedFile);
            } else {
                showAlert('Solo se permiten archivos Excel con extensión .xlsx');
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.name.endsWith('.xlsx')) {
                setFile(selectedFile);
                validateFile(selectedFile);
            } else {
                showAlert('Solo se permiten archivos Excel con extensión .xlsx');
            }
        }
    };

    // Step 1: Validate Excel file
    const validateFile = async (fileToValidate: File) => {
        setValidating(true);
        setReport(null);
        setSuccessMessage(null);
        
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', fileToValidate);

            const res = await fetch(`${API_URL}/api/v1/admin/bulk-upload/validate/?type=${activeTab}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await res.json();
            if (res.ok || res.status === 400 || res.status === 207) {
                setReport(data);
                if (data.success) {
                    showAlert('El archivo fue verificado correctamente. No se encontraron errores de validación.', 'success');
                } else {
                    showAlert(`Se encontraron ${data.summary.errors_count} errores en el archivo. Corríjalos para poder realizar la carga.`, 'warning');
                }
            } else {
                throw new Error(data.message || 'Error al validar el archivo.');
            }
        } catch (error: any) {
            console.error(error);
            showAlert(error.message || 'Error de conexión con el servidor.');
            setFile(null);
        } finally {
            setValidating(false);
        }
    };

    // Step 2: Atomic Import
    const handleImport = async () => {
        if (!file || !report?.success) return;

        const confirmed = await showConfirm(
            `¿Está seguro de que desea importar los ${report.summary.total_rows} registros válidos del archivo? Esta acción modificará la base de datos de manera atómica.`,
            "Confirmar Carga Masiva",
            "Sí, Cargar",
            "Cancelar"
        );

        if (!confirmed) return;

        setImporting(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`${API_URL}/api/v1/admin/bulk-upload/import/?type=${activeTab}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await res.json();
            if (res.ok) {
                setSuccessMessage(data.message || 'Carga completada con éxito.');
                showAlert(data.message || 'Importación completada con éxito.', 'success');
            } else {
                showAlert(data.message || 'Error en el cargue masivo.');
                if (data.errors) {
                    setReport(data);
                }
            }
        } catch (error: any) {
            console.error(error);
            showAlert(error.message || 'Error al importar los datos.');
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Carga Masiva</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        Carga y exporta inmuebles y usuarios de forma masiva desde plantillas Excel (.xlsx).
                    </p>
                </div>
            </div>

            {/* Selector de pestañas */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
                <button
                    onClick={() => handleTabChange('properties')}
                    className={`pb-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
                        activeTab === 'properties'
                            ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <FileSpreadsheet className="w-4 h-4" />
                    Inmuebles
                </button>
                <button
                    onClick={() => handleTabChange('users')}
                    className={`pb-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
                        activeTab === 'users'
                            ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <FileSpreadsheet className="w-4 h-4" />
                    Usuarios / Inquilinos
                </button>
            </div>

            {/* Main Cards Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left side actions (Template download & Export) */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
                        <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">1. Obtener Formato</h3>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                            Descarga la plantilla vacía con los encabezados adecuados para llenar la información o exporta todos los registros actuales.
                        </p>
                        
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => handleDownload('template')}
                                className="w-full px-5 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4 text-rose-600" />
                                Descargar Plantilla
                            </button>
                            <button
                                onClick={() => handleDownload('export')}
                                className="w-full px-5 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4 text-rose-600" />
                                Exportar Todo
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Reglas de Importación</h3>
                        <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 list-disc pl-4 leading-relaxed font-semibold">
                            {activeTab === 'properties' ? (
                                <>
                                    <li>Las columnas <span className="text-rose-600 font-bold">Dirección</span>, <span className="text-rose-600 font-bold">Título</span> y <span className="text-rose-600 font-bold">Tipo</span> son obligatorias.</li>
                                    <li>La dirección debe ser única en el sistema (sin registros existentes).</li>
                                    <li>El tipo de propiedad debe ser: APARTAMENTO, CASA, LOCAL o BODEGA.</li>
                                    <li>Los campos numéricos (Habitaciones, Baños, Salas, Cocinas, Garajes) deben ser enteros válidos.</li>
                                    <li>Los campos Sí/No (Es Comercial, En Conjunto, Admin Incluida) admiten valores: S, SI, N, NO.</li>
                                </>
                            ) : (
                                <>
                                    <li>El <span className="text-rose-600 font-bold">Correo Electrónico</span>, <span className="text-rose-600 font-bold">Nombres</span>, <span className="text-rose-600 font-bold">Apellidos</span>, <span className="text-rose-600 font-bold">Tipo Documento</span> y <span className="text-rose-600 font-bold">Número Documento</span> son obligatorios.</li>
                                    <li>El Correo y Número de Documento deben ser únicos en la base de datos.</li>
                                    <li>El tipo de documento debe ser: CC, CE, PASAPORTE o NIT.</li>
                                    <li>El teléfono debe ser un celular de exactamente 10 dígitos numéricos.</li>
                                    <li>El rol debe ser: ARRENDATARIO, ASISTENTE, TECNICO o ADMINISTRADOR (por defecto Arrendatario).</li>
                                </>
                            )}
                            <li className="text-rose-600 font-bold">Si una fila presenta algún error, no se guardará ningún dato de todo el documento.</li>
                        </ul>
                    </div>
                </div>

                {/* Right side Upload & Results wizard */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Drag & drop dropzone */}
                    {!file && !successMessage && (
                        <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full h-80 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 relative ${
                                dragActive
                                    ? "border-rose-600 bg-rose-50/10"
                                    : "border-slate-300 hover:border-rose-500 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 dark:border-slate-800"
                            }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center shrink-0 shadow-sm mb-4 border border-rose-100/50 dark:border-rose-900/30">
                                <UploadCloud className="w-8 h-8 text-rose-600" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Cargar Archivo Excel</h3>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed">
                                Arrastre y suelte aquí su archivo con formato <span className="text-rose-600 font-black">.xlsx</span> o haga clic para buscar en su equipo.
                            </p>
                        </div>
                    )}

                    {/* Validating loading state */}
                    {validating && (
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center space-y-4">
                            <RefreshCw className="w-10 h-10 text-rose-600 animate-spin" />
                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Validando Documento</h3>
                            <p className="text-xs font-semibold text-slate-400 text-center max-w-sm leading-relaxed">
                                Procesando las filas y verificando restricciones de unicidad y formato con la base de datos...
                            </p>
                        </div>
                    )}

                    {/* Success screen */}
                    {successMessage && (
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center space-y-6 animate-in zoom-in-95 duration-300">
                            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/50 dark:border-emerald-900/30">
                                <Check className="w-8 h-8 text-emerald-600" strokeWidth={3} />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">¡Importación Exitosa!</h3>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                                    {successMessage}
                                </p>
                            </div>
                            <button
                                onClick={resetState}
                                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl uppercase tracking-widest transition-all"
                            >
                                Cargar otro archivo
                            </button>
                        </div>
                    )}

                    {/* Validation results summary & tables */}
                    {!validating && file && report && !successMessage && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* File name info & reset */}
                            <div className="bg-slate-100 dark:bg-slate-800/60 p-4 rounded-2xl flex items-center justify-between border border-transparent dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-xl flex items-center justify-center shrink-0 border border-rose-100/50 dark:border-rose-900/30">
                                        <FileText className="w-5 h-5 text-rose-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-xs">{file.name}</p>
                                        <p className="text-[10px] font-semibold text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                                <button
                                    onClick={resetState}
                                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Alert state banner */}
                            {report.success ? (
                                <div className="p-5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/20 rounded-2xl flex gap-3 items-start">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-tight">Archivo Listo Para Importar</h4>
                                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400/90 leading-normal mt-1">
                                            Se validaron <span className="font-black">{report.summary.total_rows}</span> filas. No se detectaron problemas de formato o unicidad.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-5 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/20 rounded-2xl flex gap-3 items-start">
                                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-black text-rose-800 dark:text-rose-300 uppercase tracking-tight">Errores de Validación Encontrados</h4>
                                        <p className="text-xs font-semibold text-rose-700 dark:text-rose-400/90 leading-normal mt-1">
                                            Se encontraron <span className="font-black">{report.summary.errors_count}</span> errores en el archivo. La carga está bloqueada hasta corregirlos todos en su archivo de origen.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Tables section */}
                            {report.success ? (
                                /* Preview Table */
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
                                    <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                                        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Vista Previa de Carga</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                                                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fila</th>
                                                    {activeTab === 'properties' ? (
                                                        <>
                                                            <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dirección</th>
                                                            <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Título</th>
                                                            <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo</th>
                                                            <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Precio</th>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</th>
                                                            <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre Completo</th>
                                                            <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identificación</th>
                                                            <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rol</th>
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                {report.preview.slice(0, 10).map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10">
                                                        <td className="px-5 py-3 text-slate-400">{item.row}</td>
                                                        {activeTab === 'properties' ? (
                                                            <>
                                                                <td className="px-5 py-3 text-slate-900 dark:text-white max-w-[200px] truncate">{item.direccion}</td>
                                                                <td className="px-5 py-3">{item.propietario}</td>
                                                                <td className="px-5 py-3">
                                                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase">{item.tipo}</span>
                                                                </td>
                                                                <td className="px-5 py-3">${item.precio?.toLocaleString('es-CO')} COP</td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td className="px-5 py-3 text-slate-900 dark:text-white lowercase">{item.email}</td>
                                                                <td className="px-5 py-3 capitalize">{item.nombre}</td>
                                                                <td className="px-5 py-3 uppercase">{item.documento}</td>
                                                                <td className="px-5 py-3">
                                                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-50 text-blue-700 dark:bg-blue-900/10 dark:text-blue-400 font-bold uppercase">{item.rol}</span>
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {report.preview.length > 10 && (
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Y {report.preview.length - 10} filas más en el archivo.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Errors Table */
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                                    <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                                        <h3 className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">Detalle de Errores</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                                                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fila</th>
                                                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Columna / Campo</th>
                                                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descripción del error</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                {report.errors.map((err, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 text-rose-600 dark:text-rose-400">
                                                        <td className="px-5 py-3 font-bold text-slate-400">{err.row}</td>
                                                        <td className="px-5 py-3 font-bold uppercase tracking-wider text-[10px]">{err.field}</td>
                                                        <td className="px-5 py-3 text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{err.message}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Control button steps */}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={resetState}
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition uppercase tracking-widest"
                                >
                                    Cancelar
                                </button>
                                {report.success && (
                                    <button
                                        onClick={handleImport}
                                        disabled={importing}
                                        className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-400 text-white text-xs font-black rounded-xl transition shadow-lg shadow-rose-600/20 uppercase tracking-widest flex items-center gap-2 cursor-pointer"
                                    >
                                        {importing ? (
                                            <>
                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                Importando...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4" strokeWidth={2.5} />
                                                Confirmar y Cargar
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

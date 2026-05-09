// TallerPro v5.0 — PWA para Vercel
// Fuente de verdad: PROMPT_TALLER_v5.0_FINAL.md
// DB: localStorage (espejo fiel del schema SQLite del prompt)
// Lógica de negocio: sección 6 y 7 del prompt

import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Users, ClipboardList, Package, BookOpen,
  DollarSign, BarChart3, Settings, LogOut, Menu, X, Bell,
  Search, Plus, ChevronRight, Eye, EyeOff, AlertTriangle,
  CheckCircle, Clock, Wrench, XCircle, Phone, Mail, MapPin,
  Shield, Database, Palette, Building2, Edit2, Trash2, Lock,
  Unlock, Download, RefreshCw, TrendingUp, TrendingDown,
  Banknote, Save, Camera, ArrowUpRight, ArrowDownRight, Check,
  AlertCircle, Filter, CreditCard, FileText, Star,
  Activity, Upload
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// CAPA DE BASE DE DATOS — localStorage como espejo del schema SQLite
// ═══════════════════════════════════════════════════════════════════════════

const DB = {
  KEYS: {
    USUARIOS:          "tp_v5_usuarios",
    CLIENTES:          "tp_v5_clientes",
    PROVEEDORES:       "tp_v5_proveedores",
    LOTES:             "tp_v5_lotes",
    REPUESTOS:         "tp_v5_repuestos",
    ORDENES:           "tp_v5_ordenes",
    ORDEN_REPUESTOS:   "tp_v5_orden_repuestos",
    ORDEN_FOTOS:       "tp_v5_orden_fotos",
    PAGOS:             "tp_v5_pagos",
    KARDEX:            "tp_v5_movimientos_kardex",
    CAJA:              "tp_v5_caja",
    MOV_CAJA:          "tp_v5_movimientos_caja",
    AUDIT:             "tp_v5_audit_log",
    CONFIG:            "tp_v5_configuracion",
    CONFIG_TALLER:     "tp_v5_configuracion_taller",
    CONFIG_UI:         "tp_v5_configuracion_ui",
    SESSION:           "tp_v5_session",
  },

  get(key) {
    try { return JSON.parse(localStorage.getItem(key) || "null"); }
    catch { return null; }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  getArr(key) { return this.get(key) || []; },
  setArr(key, arr) { this.set(key, arr); },

  nextId(key) {
    const arr = this.getArr(key);
    return arr.length ? Math.max(...arr.map(r => r.id)) + 1 : 1;
  },
};

// ─── Semillas iniciales (se ejecutan una sola vez) ─────────────────────────
function initDB() {
  if (DB.get(DB.KEYS.CONFIG) !== null) return; // ya inicializado

  // configuracion (sección 2.6 del prompt)
  DB.set(DB.KEYS.CONFIG, {
    factor_instalacion:     1.5,
    stock_minimo_global:    2,
    plazo_recogida_dias:    30,
    garantia_taller_dias:   30,
    formato_codigo_repuesto:"RQ",
    formato_codigo_orden:   "ORD",
    intentos_maximos_login: 5,
    tiempo_bloqueo_minutos: 15,
    reserva_duracion_horas: 2,
    backup_contrasena:      "",
    backup_dias_retener:    30,
  });

  // configuracion_taller (sección 2.14)
  DB.set(DB.KEYS.CONFIG_TALLER, {
    nombre_taller:  "Mi Taller",
    nit_rut:        "",
    propietario:    "",
    direccion:      "",
    ciudad:         "",
    telefono:       "",
    whatsapp:       "",
    email:          "",
    sitio_web:      "",
    slogan:         "",
    pie_factura:    "Garantía 30 días en mano de obra.",
  });

  // configuracion_ui (sección 2.15)
  DB.set(DB.KEYS.CONFIG_UI, {
    tema:              "claro",
    color_primario:    "#4f46e5",
    color_secundario:  "#64748B",
    color_acento:      "#f59e0b",
    moneda_simbolo:    "$",
    moneda_codigo:     "COP",
    formato_fecha:     "DD/MM/YYYY",
    separador_decimal: ",",
    separador_miles:   ".",
    idioma:            "es",
  });

  // Usuario ADM inicial — contraseña hasheada con SHA-256
  // (hash de "admin123" precomputado; se actualiza al cambiar contraseña)
  DB.setArr(DB.KEYS.USUARIOS, [{
    id: 1,
    email:          "admin@taller.co",
    password_hash:  "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9", // sha256("admin123")
    rol:            "ADM",
    nombre:         "Administrador",
    activo:         1,
    intentos_login: 0,
    bloqueado_hasta: null,
    deleted_at:     null,
    created_at:     new Date().toISOString(),
  }]);

  // Proveedor apertura (seed — sección 2.4)
  DB.setArr(DB.KEYS.PROVEEDORES, [{
    id: 1, nombre: "APERTURA", telefono: "", email: "", confiabilidad: 5,
    created_at: new Date().toISOString(),
  }]);

  // Lote de apertura (stock inicial)
  DB.setArr(DB.KEYS.LOTES, [{
    id: 1, referencia: "STOCK INICIAL 2026", proveedor_id: 1,
    fecha_compra: "2026-01-01", factura: "APERTURA",
    cantidad: 100, costo_unitario: 0,
    created_at: new Date().toISOString(),
  }]);

  // Repuestos demo
  const repuestos = [
    { id:1, codigo_interno:"RQ000001", tipo:"Pantalla",  marca:"Samsung", modelo:"Galaxy S23",   lote_id:1, stock:5,  stock_reservado:0, ubicacion:"A-01", calidad:"original",       imagen:null, deleted_at:null, created_at:"2026-01-01T00:00:00Z" },
    { id:2, codigo_interno:"RQ000002", tipo:"Batería",   marca:"iPhone",  modelo:"14 Pro",        lote_id:1, stock:8,  stock_reservado:0, ubicacion:"B-03", calidad:"compatible",      imagen:null, deleted_at:null, created_at:"2026-01-01T00:00:00Z" },
    { id:3, codigo_interno:"RQ000003", tipo:"Pantalla",  marca:"iPhone",  modelo:"14 Pro",        lote_id:1, stock:2,  stock_reservado:0, ubicacion:"A-02", calidad:"original",        imagen:null, deleted_at:null, created_at:"2026-01-01T00:00:00Z" },
    { id:4, codigo_interno:"RQ000004", tipo:"Conector",  marca:"Samsung", modelo:"A54",           lote_id:1, stock:12, stock_reservado:0, ubicacion:"C-01", calidad:"compatible",      imagen:null, deleted_at:null, created_at:"2026-01-01T00:00:00Z" },
    { id:5, codigo_interno:"RQ000005", tipo:"Batería",   marca:"Xiaomi",  modelo:"Redmi Note 12", lote_id:1, stock:1,  stock_reservado:0, ubicacion:"B-05", calidad:"compatible",      imagen:null, deleted_at:null, created_at:"2026-01-01T00:00:00Z" },
    { id:6, codigo_interno:"RQ000006", tipo:"Cámara",    marca:"Samsung", modelo:"Galaxy S23",    lote_id:1, stock:3,  stock_reservado:0, ubicacion:"D-02", calidad:"remanufacturado", imagen:null, deleted_at:null, created_at:"2026-01-01T00:00:00Z" },
  ];
  DB.setArr(DB.KEYS.REPUESTOS, repuestos);

  // Kardex inicial (entradas del stock inicial)
  const kardex = repuestos.map((r, i) => ({
    id: i + 1, repuesto_id: r.id, tipo: "entrada",
    cantidad: r.stock, orden_id: null, usuario_id: 1,
    motivo: "Stock inicial de apertura",
    created_at: "2026-01-01T08:00:00Z",
  }));
  DB.setArr(DB.KEYS.KARDEX, kardex);

  // Clientes demo
  DB.setArr(DB.KEYS.CLIENTES, [
    { id:1, nombre:"Jorge Ramírez",  telefono:"3001234567", email:"jorge@email.com", direccion:"Calle 1 #2-3", deleted_at:null, created_at:"2026-01-10T00:00:00Z" },
    { id:2, nombre:"María González", telefono:"3107654321", email:"maria@email.com", direccion:"Cra 4 #5-6",   deleted_at:null, created_at:"2026-02-05T00:00:00Z" },
    { id:3, nombre:"Pedro Castro",   telefono:"3209876543", email:null,              direccion:null,            deleted_at:null, created_at:"2026-02-20T00:00:00Z" },
  ]);

  // Órdenes demo
  DB.setArr(DB.KEYS.ORDENES, [
    { id:1, numero_orden:"ORD-20260415-00001", cliente_id:1, equipo_marca:"Samsung", equipo_modelo:"Galaxy S23", imei:"356789012345678", estado:"listo",     falla_reportada:"Pantalla rota",  diagnostico:"Cambio de pantalla", tecnico_id:null, prioridad:"normal", fecha_ingreso:"2026-04-15T08:00:00Z", fecha_entrega:null, valor_mano_obra:80000,  descuento:0,  motivo_anulacion:null, deleted_at:null, created_by:1, created_at:"2026-04-15T08:00:00Z" },
    { id:2, numero_orden:"ORD-20260418-00002", cliente_id:2, equipo_marca:"iPhone",  equipo_modelo:"14 Pro",     imei:"353456789012345", estado:"reparando",  falla_reportada:"Sin carga",      diagnostico:"Cambio de conector", tecnico_id:null, prioridad:"urgente",fecha_ingreso:"2026-04-18T09:00:00Z", fecha_entrega:null, valor_mano_obra:120000, descuento:10, motivo_anulacion:null, deleted_at:null, created_by:1, created_at:"2026-04-18T09:00:00Z" },
    { id:3, numero_orden:"ORD-20260420-00003", cliente_id:3, equipo_marca:"Xiaomi",  equipo_modelo:"Redmi Note 12", imei:null,           estado:"diagnostico",falla_reportada:"No enciende",    diagnostico:null,                tecnico_id:null, prioridad:"normal", fecha_ingreso:"2026-04-20T10:00:00Z", fecha_entrega:null, valor_mano_obra:0,      descuento:0,  motivo_anulacion:null, deleted_at:null, created_by:1, created_at:"2026-04-20T10:00:00Z" },
  ]);

  // Orden-repuestos demo
  DB.setArr(DB.KEYS.ORDEN_REPUESTOS, [
    { id:1, orden_id:1, repuesto_id:1, cantidad:1, valor_unitario:142500, instalado:1, created_at:"2026-04-15T09:00:00Z" },
  ]);

  // Pagos demo
  DB.setArr(DB.KEYS.PAGOS, [
    { id:1, orden_id:1, monto:222500, metodo:"efectivo", notas:"Pago completo", fecha:"2026-04-16T10:00:00Z" },
  ]);

  // Caja (apertura del día)
  DB.set(DB.KEYS.CAJA, {
    fecha: new Date().toISOString().slice(0,10),
    saldo_inicial: 500000,
    cerrado_por: null,
    saldo_final: null,
    abierta: true,
    created_at: new Date().toISOString(),
  });

  DB.setArr(DB.KEYS.MOV_CAJA, [
    { id:1, tipo:"ingreso", monto:222500, concepto:"Pago orden ORD-20260415-00001", referencia:"pago:1", usuario_id:1, metodo:"efectivo",     created_at:"2026-04-16T10:00:00Z" },
    { id:2, tipo:"ingreso", monto:150000, concepto:"Anticipo orden ORD-20260418-00002", referencia:null, usuario_id:1, metodo:"transferencia", created_at:"2026-04-18T11:00:00Z" },
  ]);

  DB.setArr(DB.KEYS.AUDIT, []);
  DB.setArr(DB.KEYS.ORDEN_FOTOS, []);
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICIOS DE NEGOCIO — sección 6 y 7 del prompt
// ═══════════════════════════════════════════════════════════════════════════

// Hash SHA-256 (síncrono via TextEncoder + subtle — returns Promise)
async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}

// 7.3 insertAuditLog — JSON tipado y validado
function insertAuditLog({ usuarioId, accion, entidad, entidadId, payload }) {
  let cambiosJson;
  try {
    cambiosJson = JSON.stringify({
      antes:   payload.antes   ?? null,
      despues: payload.despues ?? null,
      campos:  payload.campos  ?? [],
    });
  } catch { cambiosJson = JSON.stringify({ error: "payload_no_serializable" }); }

  const logs = DB.getArr(DB.KEYS.AUDIT);
  logs.push({
    id:         DB.nextId(DB.KEYS.AUDIT),
    usuario_id: usuarioId,
    accion,
    entidad,
    entidad_id: entidadId,
    cambios:    cambiosJson,
    fecha:      new Date().toISOString(),
  });
  DB.setArr(DB.KEYS.AUDIT, logs);
}

// 7.1 generarCodigoRepuesto
function generarCodigoRepuesto() {
  const cfg = DB.get(DB.KEYS.CONFIG);
  const prefijo = cfg?.formato_codigo_repuesto ?? "RQ";
  const arr = DB.getArr(DB.KEYS.REPUESTOS).filter(r => !r.deleted_at);
  if (!arr.length) return `${prefijo}000001`;
  const maxId = Math.max(...arr.map(r => {
    const n = parseInt(r.codigo_interno.replace(prefijo, ""), 10);
    return isNaN(n) ? 0 : n;
  }));
  return prefijo + String(maxId + 1).padStart(6, "0");
}

// 7.2 generarNumeroOrden — secuencia global sin reset diario
function generarNumeroOrden() {
  const cfg  = DB.get(DB.KEYS.CONFIG);
  const pref = cfg?.formato_codigo_orden ?? "ORD";
  const fecha = new Date().toISOString().slice(0,10).replace(/-/g,"");
  const arr   = DB.getArr(DB.KEYS.ORDENES);
  let seq = 1;
  if (arr.length) {
    const ultima = arr[arr.length - 1].numero_orden;
    const partes = ultima.split("-");
    const n = parseInt(partes[partes.length - 1], 10);
    if (!isNaN(n)) seq = n + 1;
  }
  return `${pref}-${fecha}-${String(seq).padStart(5,"0")}`;
}

// 6.1 Selección FIFO para repuestos — lote más antiguo con stock_disponible >= cantidad
function seleccionarRepuestoFIFO(tipo, marca, modelo, cantidadRequerida = 1) {
  const lotes     = DB.getArr(DB.KEYS.LOTES);
  const repuestos = DB.getArr(DB.KEYS.REPUESTOS).filter(r =>
    !r.deleted_at &&
    r.tipo  === tipo &&
    r.marca === marca &&
    r.modelo=== modelo &&
    (r.stock - r.stock_reservado) >= cantidadRequerida
  );
  if (!repuestos.length) return null;

  // ordenar por fecha_compra del lote ASC (FIFO)
  repuestos.sort((a, b) => {
    const la = lotes.find(l => l.id === a.lote_id);
    const lb = lotes.find(l => l.id === b.lote_id);
    const da = la ? new Date(la.fecha_compra) : 0;
    const db_ = lb ? new Date(lb.fecha_compra) : 0;
    return da - db_;
  });

  const best = repuestos[0];
  const lote = lotes.find(l => l.id === best.lote_id);
  return { ...best, costo_unitario: lote?.costo_unitario ?? 0 };
}

// 6.2 reservarRepuesto — atomico (síncrono con localStorage)
function reservarRepuesto(repuestoId, ordenId, cantidad, userId, valorUnitario) {
  const repuestos = DB.getArr(DB.KEYS.REPUESTOS);
  const rep = repuestos.find(r => r.id === repuestoId && !r.deleted_at);
  if (!rep) throw new Error("REPUESTO_NO_ENCONTRADO");
  if ((rep.stock - rep.stock_reservado) < cantidad) throw new Error("STOCK_INSUFICIENTE");

  const cfg  = DB.get(DB.KEYS.CONFIG);
  const horas = cfg?.reserva_duracion_horas ?? 2;
  const hasta = new Date(Date.now() + horas * 3600 * 1000).toISOString();

  // Actualizar stock_reservado y reservado_hasta
  const updated = repuestos.map(r => r.id === repuestoId
    ? { ...r, stock_reservado: r.stock_reservado + cantidad, reservado_hasta: hasta, reservado_por: userId }
    : r
  );
  DB.setArr(DB.KEYS.REPUESTOS, updated);

  // Insertar en orden_repuestos
  const oreps = DB.getArr(DB.KEYS.ORDEN_REPUESTOS);
  const existe = oreps.find(o => o.orden_id === ordenId && o.repuesto_id === repuestoId);
  if (existe) throw new Error("REPUESTO_YA_ASIGNADO");

  oreps.push({
    id: DB.nextId(DB.KEYS.ORDEN_REPUESTOS),
    orden_id: ordenId, repuesto_id: repuestoId,
    cantidad, valor_unitario: valorUnitario, instalado: 0,
    created_at: new Date().toISOString(),
  });
  DB.setArr(DB.KEYS.ORDEN_REPUESTOS, oreps);
}

// 6.3 instalarRepuesto — libera reserva y descuenta stock
function instalarRepuesto(repuestoId, ordenId, cantidad, userId) {
  const repuestos = DB.getArr(DB.KEYS.REPUESTOS);
  const rep = repuestos.find(r => r.id === repuestoId);
  if (!rep) throw new Error("REPUESTO_NO_ENCONTRADO");

  // Liberar reserva
  const updated = repuestos.map(r => r.id === repuestoId
    ? { ...r,
        stock:          r.stock - cantidad,
        stock_reservado: Math.max(0, r.stock_reservado - cantidad),
        reservado_hasta: null,
        reservado_por:   null }
    : r
  );
  // Trigger: validar_stock_positivo [VAL-02 equivalente en JS]
  const nuevo = updated.find(r => r.id === repuestoId);
  if (nuevo.stock < 0) throw new Error("stock_negativo: operacion rechazada");
  DB.setArr(DB.KEYS.REPUESTOS, updated);

  // Marcar instalado en orden_repuestos
  const oreps = DB.getArr(DB.KEYS.ORDEN_REPUESTOS).map(o =>
    (o.orden_id === ordenId && o.repuesto_id === repuestoId) ? { ...o, instalado: 1 } : o
  );
  DB.setArr(DB.KEYS.ORDEN_REPUESTOS, oreps);

  // Kardex: tipo=salida (inmutable — solo push, nunca editar/borrar)
  const kardex = DB.getArr(DB.KEYS.KARDEX);
  kardex.push({
    id: DB.nextId(DB.KEYS.KARDEX),
    repuesto_id: repuestoId, tipo: "salida", cantidad,
    orden_id: ordenId, usuario_id: userId,
    motivo: `Instalación en orden`,
    created_at: new Date().toISOString(),
  });
  DB.setArr(DB.KEYS.KARDEX, kardex);
}

// 6.4 registrarPago — atómico: pago + movimiento_caja
function registrarPago(ordenId, monto, metodo, notas, userId) {
  // Insertar pago
  const pagos = DB.getArr(DB.KEYS.PAGOS);
  const pagoId = DB.nextId(DB.KEYS.PAGOS);
  pagos.push({ id: pagoId, orden_id: ordenId, monto, metodo, notas, fecha: new Date().toISOString() });
  DB.setArr(DB.KEYS.PAGOS, pagos);

  // Insertar movimiento_caja [VAL-04]
  const movs = DB.getArr(DB.KEYS.MOV_CAJA);
  movs.push({
    id:         DB.nextId(DB.KEYS.MOV_CAJA),
    tipo:       "ingreso",
    monto,
    concepto:   `Pago orden ${ordenId}`,
    referencia: `pago:${pagoId}`,
    usuario_id: userId,
    metodo,
    created_at: new Date().toISOString(),
  });
  DB.setArr(DB.KEYS.MOV_CAJA, movs);

  return pagoId;
}

// 6.5 liberarReservasVencidas — job cada 5 min
function liberarReservasVencidas() {
  const ahora = new Date();
  const repuestos = DB.getArr(DB.KEYS.REPUESTOS);
  const oreps     = DB.getArr(DB.KEYS.ORDEN_REPUESTOS);

  const updated = repuestos.map(r => {
    if (r.reservado_hasta && new Date(r.reservado_hasta) <= ahora) {
      // Calcular cuánto se reservó (no instalado)
      const cantReservada = oreps
        .filter(o => o.repuesto_id === r.id && !o.instalado)
        .reduce((s, o) => s + o.cantidad, 0);
      return {
        ...r,
        stock_reservado: Math.max(0, r.stock_reservado - cantReservada),
        reservado_hasta: null,
        reservado_por:   null,
      };
    }
    return r;
  });
  DB.setArr(DB.KEYS.REPUESTOS, updated);
}

// Saldo actual de caja (reconstruido desde movimientos_caja — [VAL-04])
function calcularSaldoCaja() {
  const caja = DB.get(DB.KEYS.CAJA);
  const movs = DB.getArr(DB.KEYS.MOV_CAJA);
  const saldoInicial = caja?.saldo_inicial ?? 0;
  const delta = movs.reduce((acc, m) => acc + (m.tipo === "ingreso" ? m.monto : -m.monto), 0);
  return saldoInicial + delta;
}

// Total de una orden
function calcularTotalOrden(ordenId) {
  const orden = DB.getArr(DB.KEYS.ORDENES).find(o => o.id === ordenId);
  if (!orden) return 0;
  const oreps = DB.getArr(DB.KEYS.ORDEN_REPUESTOS).filter(o => o.orden_id === ordenId);
  const totalRep = oreps.reduce((s, o) => s + o.valor_unitario * o.cantidad, 0);
  const total = orden.valor_mano_obra + totalRep;
  return total * (1 - (orden.descuento ?? 0) / 100);
}

function calcularPagadoOrden(ordenId) {
  return DB.getArr(DB.KEYS.PAGOS)
    .filter(p => p.orden_id === ordenId)
    .reduce((s, p) => s + p.monto, 0);
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTENTICACIÓN
// ═══════════════════════════════════════════════════════════════════════════

async function loginUser(email, password) {
  const cfg  = DB.get(DB.KEYS.CONFIG);
  const maxInt = cfg?.intentos_maximos_login ?? 5;
  const blqMin = cfg?.tiempo_bloqueo_minutos ?? 15;
  const usuarios = DB.getArr(DB.KEYS.USUARIOS);
  const user = usuarios.find(u => u.email?.toLowerCase().trim() === email.toLowerCase().trim());

  if (!user || !user.activo) throw new Error("CREDENCIALES_INVALIDAS");

  if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) {
    const mins = Math.ceil((new Date(user.bloqueado_hasta) - new Date()) / 60000);
    throw new Error(`CUENTA_BLOQUEADA:${mins}`);
  }

  const hash = await sha256(password);
  if (hash !== user.password_hash) {
    const intentos = (user.intentos_login ?? 0) + 1;
    const bloqueo = intentos >= maxInt
      ? new Date(Date.now() + blqMin * 60000).toISOString()
      : user.bloqueado_hasta;
    const updated = usuarios.map(u => u.id === user.id
      ? { ...u, intentos_login: intentos, bloqueado_hasta: bloqueo } : u);
    DB.setArr(DB.KEYS.USUARIOS, updated);
    insertAuditLog({ usuarioId: user.id, accion: "LOGIN_FALLIDO", entidad: "usuarios", entidadId: user.id, payload: { antes: null, despues: null, campos: ["email"] } });
    throw new Error("CREDENCIALES_INVALIDAS");
  }

  // Éxito
  const updated = usuarios.map(u => u.id === user.id
    ? { ...u, intentos_login: 0, bloqueado_hasta: null } : u);
  DB.setArr(DB.KEYS.USUARIOS, updated);
  insertAuditLog({ usuarioId: user.id, accion: "LOGIN", entidad: "usuarios", entidadId: user.id, payload: { antes: null, despues: { nombre: user.nombre, rol: user.rol }, campos: [] } });

  const sesion = { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, ts: Date.now() };
  DB.set(DB.KEYS.SESSION, sesion);
  return sesion;
}

function getCurrentUser() { return DB.get(DB.KEYS.SESSION); }
function logout() { DB.set(DB.KEYS.SESSION, null); }

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES DE UI — sección 3 del prompt
// ═══════════════════════════════════════════════════════════════════════════

const ESTADOS_ORDEN = ["recibido","diagnostico","espera_repuesto","reparando","calidad","listo","entregado","anulado"];
const ESTADO_COLORS = {
  recibido:        "bg-slate-100 text-slate-700",
  diagnostico:     "bg-blue-100 text-blue-700",
  espera_repuesto: "bg-amber-100 text-amber-700",
  reparando:       "bg-orange-100 text-orange-700",
  calidad:         "bg-purple-100 text-purple-700",
  listo:           "bg-green-100 text-green-700",
  entregado:       "bg-teal-100 text-teal-700",
  anulado:         "bg-red-100 text-red-700",
};
const ESTADO_LABELS = {
  recibido:"Recibido", diagnostico:"Diagnóstico", espera_repuesto:"Espera Repuesto",
  reparando:"Reparando", calidad:"Control Calidad", listo:"Listo",
  entregado:"Entregado", anulado:"Anulado",
};
const PERMISOS = {
  ADM: { clientes_editar:true,clientes_eliminar:true,ordenes_crear:true,ordenes_anular:true,inventario_ingresar:true,inventario_ajuste:true,repuestos_instalar:true,pagos:true,caja:true,config:true,usuarios:true,dashboard_fin:true },
  CON: { clientes_editar:false,clientes_eliminar:false,ordenes_crear:false,ordenes_anular:false,inventario_ingresar:true,inventario_ajuste:false,repuestos_instalar:false,pagos:true,caja:true,config:false,usuarios:false,dashboard_fin:true },
  TEC: { clientes_editar:false,clientes_eliminar:false,ordenes_crear:false,ordenes_anular:false,inventario_ingresar:false,inventario_ajuste:false,repuestos_instalar:true,pagos:false,caja:false,config:false,usuarios:false,dashboard_fin:false },
  REC: { clientes_editar:true,clientes_eliminar:false,ordenes_crear:true,ordenes_anular:true,inventario_ingresar:false,inventario_ajuste:false,repuestos_instalar:false,pagos:true,caja:false,config:false,usuarios:false,dashboard_fin:false },
  AUD: { clientes_editar:false,clientes_eliminar:false,ordenes_crear:false,ordenes_anular:false,inventario_ingresar:false,inventario_ajuste:false,repuestos_instalar:false,pagos:false,caja:false,config:false,usuarios:false,dashboard_fin:true },
};
const ROLE_LABELS = { ADM:"Administrador", CON:"Contador", TEC:"Técnico", REC:"Recepcionista", AUD:"Auditor" };
const ROLE_COLORS = { ADM:"bg-violet-100 text-violet-700", CON:"bg-blue-100 text-blue-700", TEC:"bg-orange-100 text-orange-700", REC:"bg-green-100 text-green-700", AUD:"bg-slate-100 text-slate-700" };

// ─── Formatters ──────────────────────────────────────────────────────────
const fmt  = n => new Intl.NumberFormat("es-CO",{ style:"currency", currency:"COP", minimumFractionDigits:0 }).format(n || 0);
const fmtDate = d => d ? new Date(d).toLocaleDateString("es-CO") : "—";
const todayISO = () => new Date().toISOString();

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTES BASE DE UI
// ═══════════════════════════════════════════════════════════════════════════

function Badge({ children, className="" }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}>{children}</span>;
}
function Card({ children, className="" }) {
  return <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>{children}</div>;
}
function Button({ children, onClick, variant="primary", size="md", className="", disabled=false, icon, type="button" }) {
  const base = "inline-flex items-center gap-2 font-semibold rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1";
  const sizes = { sm:"px-3 py-1.5 text-xs", md:"px-4 py-2 text-sm", lg:"px-5 py-2.5 text-base" };
  const variants = {
    primary:   "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-400",
    danger:    "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    ghost:     "text-slate-600 hover:bg-slate-100 focus:ring-slate-400",
    success:   "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500",
    warning:   "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {icon && <span className="flex-shrink-0">{icon}</span>}{children}
    </button>
  );
}
function Input({ label, value, onChange, type="text", placeholder, required, disabled, className="", hint, readOnly, onKeyDown }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
      <input type={type} value={value ?? ""} onChange={e => onChange?.(e.target.value)} placeholder={placeholder}
        disabled={disabled} required={required} readOnly={readOnly} onKeyDown={onKeyDown}
        className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-slate-50 disabled:text-slate-400 transition" />
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
function Textarea({ label, value, onChange, rows=3, placeholder, className="" }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>}
      <textarea rows={rows} value={value ?? ""} onChange={e => onChange?.(e.target.value)} placeholder={placeholder}
        className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
    </div>
  );
}
function Select({ label, value, onChange, options, className="" }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>}
      <select value={value ?? ""} onChange={e => onChange?.(e.target.value)}
        className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
function Modal({ title, children, onClose, size="md" }) {
  const sizes = { sm:"max-w-md", md:"max-w-xl", lg:"max-w-2xl", xl:"max-w-4xl" };
  useEffect(() => {
    const handler = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}
function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
function KpiCard({ title, value, sub, icon: Icon, trend, color="indigo" }) {
  const colors = { indigo:"bg-indigo-50 text-indigo-600", green:"bg-emerald-50 text-emerald-600", amber:"bg-amber-50 text-amber-600", red:"bg-red-50 text-red-600", purple:"bg-purple-50 text-purple-600" };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${colors[color]}`}><Icon size={22} /></div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-semibold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}% vs. mes anterior
        </div>
      )}
    </Card>
  );
}
function DataTable({ columns, data, onRowClick, emptyText="Sin registros" }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map(c => <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {!data.length && <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400 text-sm">{emptyText}</td></tr>}
          {data.map((row, i) => (
            <tr key={row.id ?? i} onClick={() => onRowClick?.(row)}
              className={`border-b border-slate-100 transition-colors ${onRowClick ? "cursor-pointer hover:bg-indigo-50/40" : ""}`}>
              {columns.map(c => <td key={c.key} className="px-4 py-3 text-slate-700">{c.render ? c.render(row[c.key], row) : (row[c.key] ?? "—")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function SearchInput({ value, onChange, placeholder="Buscar..." }) {
  return (
    <div className="relative">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full" />
    </div>
  );
}
function AlertBanner({ type="warning", children }) {
  const styles = { warning:"bg-amber-50 border border-amber-200 text-amber-800", danger:"bg-red-50 border border-red-200 text-red-800", info:"bg-blue-50 border border-blue-200 text-blue-800" };
  const icons  = { warning:<AlertTriangle size={16} />, danger:<AlertCircle size={16} />, info:<AlertCircle size={16} /> };
  return <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium mb-4 ${styles[type]}`}>{icons[type]}{children}</div>;
}

// ═══════════════════════════════════════════════════════════════════════════
// PANTALLA LOGIN
// ═══════════════════════════════════════════════════════════════════════════

function LoginScreen({ onLogin }) {
  const [email, setEmail]       = useState("admin@taller.co");
  const [password, setPassword] = useState("");
  const [show, setShow]         = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handle = async () => {
    setLoading(true); setError("");
    try {
      const user = await loginUser(email, password);
      onLogin(user);
    } catch (e) {
      const msg = e.message || "";
      if (msg.startsWith("CUENTA_BLOQUEADA:")) {
        setError(`Cuenta bloqueada. Intenta en ${msg.split(":")[1]} min.`);
      } else {
        setError("Credenciales incorrectas. Intenta de nuevo.");
      }
    } finally { setLoading(false); }
  };

  const handleKey = e => { if (e.key === "Enter") handle(); };

  const DEMO_USERS = DB.getArr(DB.KEYS.USUARIOS).filter(u => u.activo);

  return (
    <div className="min-h-screen flex" style={{ background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)" }}>
      {/* Panel izquierdo */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12">
        <div className="text-center">
          <div className="w-20 h-20 bg-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl" style={{boxShadow:"0 0 60px rgba(99,102,241,.4)"}}>
            <Wrench size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">TallerPro</h1>
          <p className="text-indigo-300 text-lg">Sistema de Gestión v5.0</p>
          <p className="text-indigo-400/70 text-sm mt-2">Offline-first · 100% local · Sin servidor</p>
          <div className="mt-10 grid grid-cols-2 gap-3 text-left">
            {[["📱 Órdenes","Flujo completo de reparación"],["📦 Inventario","Kardex FIFO en tiempo real"],["💳 Caja","Movimientos contables seguros"],["📊 Reportes","Dashboard financiero y operativo"]].map(([t,d]) => (
              <div key={t} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="font-bold text-white text-sm">{t}</p>
                <p className="text-indigo-300 text-xs mt-1">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Panel derecho */}
      <div className="w-full lg:w-[440px] flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Wrench size={20} className="text-white" />
            </div>
            <span className="text-xl font-black text-slate-900">TallerPro</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Bienvenido</h2>
          <p className="text-slate-500 text-sm mb-8">Ingresa tus credenciales para continuar</p>
          <div className="space-y-4">
            <Input label="Correo electrónico" value={email} onChange={setEmail} type="email" placeholder="usuario@taller.co" onKeyDown={handleKey} />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Contraseña</label>
              <div className="relative">
                <input type={show ? "text":"password"} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKey}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2"><AlertCircle size={16} />{error}</div>}
            <Button onClick={handle} disabled={loading} className="w-full justify-center py-2.5 text-sm">
              {loading ? "Verificando..." : "Iniciar sesión"}
            </Button>
          </div>
          {/* Accesos demo */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-semibold uppercase mb-3">Acceso demo · contraseña: admin123</p>
            <div className="space-y-2">
              {DEMO_USERS.map(u => (
                <button key={u.id} type="button" onClick={() => { setEmail(u.email); setPassword("admin123"); }}
                  className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-xs">
                  <Badge className={`mr-2 ${ROLE_COLORS[u.rol]}`}>{u.rol}</Badge>
                  <span className="text-slate-700 font-medium">{u.nombre}</span>
                  <span className="text-slate-400 ml-1">· {u.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

function Dashboard({ user }) {
  const [data, setData] = useState(null);

  const load = useCallback(() => {
    const ordenes    = DB.getArr(DB.KEYS.ORDENES).filter(o => !o.deleted_at);
    const repuestos  = DB.getArr(DB.KEYS.REPUESTOS).filter(r => !r.deleted_at);
    const cfg        = DB.get(DB.KEYS.CONFIG);
    const stockMin   = cfg?.stock_minimo_global ?? 2;
    const perms      = PERMISOS[user.rol] || {};

    const activas   = ordenes.filter(o => !["entregado","anulado"].includes(o.estado));
    const listas    = ordenes.filter(o => o.estado === "listo");
    const stockBajo = repuestos.filter(r => (r.stock - r.stock_reservado) <= stockMin);

    const saldo = calcularSaldoCaja();
    const ingresosMes = DB.getArr(DB.KEYS.MOV_CAJA)
      .filter(m => m.tipo === "ingreso" && m.created_at?.startsWith(new Date().toISOString().slice(0,7)))
      .reduce((s,m) => s + m.monto, 0);

    const porEstado = {};
    ESTADOS_ORDEN.forEach(e => { porEstado[e] = ordenes.filter(o => o.estado === e).length; });

    const recientes = ordenes.slice(-5).reverse().map(o => {
      const cli = DB.getArr(DB.KEYS.CLIENTES).find(c => c.id === o.cliente_id);
      return { ...o, cliente_nombre: cli?.nombre ?? "—", total: calcularTotalOrden(o.id), pagado: calcularPagadoOrden(o.id) };
    });

    setData({ activas: activas.length, listas: listas.length, stockBajo: stockBajo.length, stockBajoList: stockBajo.slice(0,5), saldo, ingresosMes, porEstado, recientes, perms });
  }, [user.rol]);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  if (!data) return <div className="flex items-center justify-center h-64"><RefreshCw size={24} className="animate-spin text-indigo-500" /></div>;

  const { activas, listas, stockBajo, stockBajoList, saldo, ingresosMes, porEstado, recientes, perms } = data;

  return (
    <div className="page-enter">
      <PageHeader title={`Buenos días, ${user.nombre.split(" ")[0]} 👋`} subtitle={`Resumen operativo · ${new Date().toLocaleDateString("es-CO",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Órdenes activas"   value={activas}           sub="En proceso"          icon={ClipboardList} color="indigo" />
        <KpiCard title="Equipos listos"    value={listas}            sub="Esperando entrega"   icon={CheckCircle}   color="green" />
        {perms.dashboard_fin && <KpiCard title="Ingresos del mes"  value={fmt(ingresosMes)}   sub="Pagos registrados" icon={TrendingUp}   color="amber" />}
        {perms.dashboard_fin && <KpiCard title="Saldo en caja"     value={fmt(saldo)}         sub="Saldo actual"    icon={DollarSign}   color="purple" />}
        {!perms.dashboard_fin && <KpiCard title="Stock bajo mínimo" value={stockBajo} sub="Requieren reorden" icon={AlertTriangle} color="red" />}
        {!perms.dashboard_fin && <KpiCard title="Total órdenes" value={Object.values(porEstado).reduce((a,b)=>a+b,0)} sub="Historial" icon={BarChart3} color="amber" />}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {/* Órdenes por estado */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Órdenes por estado</h3>
          <div className="space-y-2">
            {ESTADOS_ORDEN.slice(0,-1).map(e => {
              const count = porEstado[e] || 0;
              const total = Object.values(porEstado).reduce((a,b)=>a+b,0) || 1;
              return (
                <div key={e} className="flex items-center gap-3">
                  <Badge className={`w-36 justify-center text-xs ${ESTADO_COLORS[e]}`}>{ESTADO_LABELS[e]}</Badge>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width:`${(count/total)*100}%` }} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>
        {/* Últimas órdenes */}
        <Card className="p-5">
          <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Últimas órdenes</h3>
          <div className="space-y-3">
            {recientes.length === 0 && <p className="text-sm text-slate-400">Sin órdenes aún.</p>}
            {recientes.map(o => (
              <div key={o.id} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Wrench size={14} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{o.numero_orden}</p>
                  <p className="text-xs text-slate-500 truncate">{o.equipo_marca} {o.equipo_modelo}</p>
                </div>
                <Badge className={ESTADO_COLORS[o.estado]}>{ESTADO_LABELS[o.estado]}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Alertas de stock */}
      {stockBajoList.length > 0 && (
        <Card className="p-5 border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-600" />
            <h3 className="font-bold text-amber-800 text-sm">Alerta de stock bajo mínimo</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {stockBajoList.map(r => (
              <div key={r.id} className="bg-white rounded-lg px-3 py-2 border border-amber-200">
                <p className="text-xs font-bold text-slate-800">{r.codigo_interno}</p>
                <p className="text-xs text-slate-500 truncate">{r.tipo} {r.marca} {r.modelo}</p>
                <p className="text-xs font-semibold text-amber-700 mt-0.5">Disponible: {r.stock - r.stock_reservado}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CLIENTES
// ═══════════════════════════════════════════════════════════════════════════

function Clientes({ user }) {
  const perms = PERMISOS[user.rol] || {};
  const [clientes, setClientes]   = useState([]);
  const [search, setSearch]       = useState("");
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState({ nombre:"", telefono:"", email:"", direccion:"" });
  const [msg, setMsg]             = useState("");
  const [histModal, setHistModal] = useState(null);

  const load = () => setClientes(DB.getArr(DB.KEYS.CLIENTES).filter(c => !c.deleted_at));
  useEffect(load, []);

  const filtered = clientes.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.telefono.includes(search) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const openNew  = () => { setForm({ nombre:"", telefono:"", email:"", direccion:"" }); setModal("nuevo"); setMsg(""); };
  const openEdit = c  => { setForm({ nombre:c.nombre, telefono:c.telefono, email:c.email||"", direccion:c.direccion||"" }); setModal(c); setMsg(""); };

  const guardar = () => {
    if (!form.nombre.trim() || !form.telefono.trim()) { setMsg("Nombre y teléfono son requeridos."); return; }
    // Validar teléfono único (idx_clientes_telefono_activo)
    const existe = clientes.find(c => c.telefono === form.telefono && (modal === "nuevo" || c.id !== modal.id));
    if (existe) { setMsg("Ya existe un cliente con ese teléfono."); return; }

    const arr = DB.getArr(DB.KEYS.CLIENTES);
    if (modal === "nuevo") {
      const nuevo = { id: DB.nextId(DB.KEYS.CLIENTES), ...form, deleted_at:null, created_at: todayISO() };
      DB.setArr(DB.KEYS.CLIENTES, [...arr, nuevo]);
      insertAuditLog({ usuarioId:user.id, accion:"CREATE", entidad:"clientes", entidadId:nuevo.id, payload:{ antes:null, despues:nuevo, campos:Object.keys(form) } });
    } else {
      const prev = arr.find(c => c.id === modal.id);
      DB.setArr(DB.KEYS.CLIENTES, arr.map(c => c.id === modal.id ? { ...c, ...form } : c));
      insertAuditLog({ usuarioId:user.id, accion:"UPDATE", entidad:"clientes", entidadId:modal.id, payload:{ antes:prev, despues:{...prev,...form}, campos:Object.keys(form) } });
    }
    load(); setModal(null);
  };

  const eliminar = c => {
    const tieneOrdenes = DB.getArr(DB.KEYS.ORDENES).some(o => o.cliente_id === c.id && !["entregado","anulado"].includes(o.estado));
    if (tieneOrdenes) { alert("Este cliente tiene órdenes activas. No se puede eliminar."); return; }
    if (!confirm(`¿Eliminar cliente ${c.nombre}?`)) return;
    const arr = DB.getArr(DB.KEYS.CLIENTES);
    DB.setArr(DB.KEYS.CLIENTES, arr.map(x => x.id === c.id ? { ...x, deleted_at: todayISO() } : x));
    insertAuditLog({ usuarioId:user.id, accion:"DELETE", entidad:"clientes", entidadId:c.id, payload:{ antes:c, despues:null, campos:[] } });
    load();
  };

  const exportCSV = () => {
    const cols = ["id","nombre","telefono","email","direccion","created_at"];
    const rows = filtered.map(c => cols.map(k => `"${(c[k]||"").toString().replace(/"/g,'""')}"`).join(","));
    const blob = new Blob([cols.join(",")+"\n"+rows.join("\n")], { type:"text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "clientes.csv"; a.click();
  };

  return (
    <div className="page-enter">
      <PageHeader title="Clientes" subtitle={`${filtered.length} registrados`}
        actions={<>
          <Button variant="secondary" size="sm" onClick={exportCSV} icon={<Download size={14} />}>CSV</Button>
          {perms.clientes_editar && <Button onClick={openNew} icon={<Plus size={16} />}>Nuevo cliente</Button>}
        </>}
      />
      <Card>
        <div className="p-4 border-b border-slate-200">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre, teléfono, email..." />
        </div>
        <DataTable
          onRowClick={perms.clientes_editar ? openEdit : undefined}
          columns={[
            { key:"nombre",   label:"Nombre" },
            { key:"telefono", label:"Teléfono", render:v => <span className="flex items-center gap-1 text-slate-600"><Phone size={12} />{v}</span> },
            { key:"email",    label:"Email",    render:v => v ? <span className="flex items-center gap-1"><Mail size={12} />{v}</span> : <span className="text-slate-300">—</span> },
            { key:"direccion",label:"Dirección",render:v => v ? <span className="flex items-center gap-1"><MapPin size={12} />{v}</span> : "—" },
            { key:"created_at",label:"Registro",render:v => fmtDate(v) },
            { key:"acciones", label:"", render:(_,row) => (
              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                <button onClick={() => { const ords = DB.getArr(DB.KEYS.ORDENES).filter(o => o.cliente_id === row.id); setHistModal({cliente:row, ordenes:ords}); }} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-indigo-600" title="Historial"><FileText size={14} /></button>
                {perms.clientes_editar && <button onClick={() => openEdit(row)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-indigo-600"><Edit2 size={14} /></button>}
                {perms.clientes_eliminar && <button onClick={() => eliminar(row)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>}
              </div>
            )},
          ]}
          data={filtered}
        />
      </Card>

      {/* Modal Crear/Editar */}
      {modal && (
        <Modal title={modal === "nuevo" ? "Nuevo cliente" : "Editar cliente"} onClose={() => setModal(null)}>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre completo" value={form.nombre} onChange={v => setForm(p=>({...p,nombre:v}))} required className="col-span-2" />
            <Input label="Teléfono" value={form.telefono} onChange={v => setForm(p=>({...p,telefono:v}))} required hint="Único por cliente" />
            <Input label="Email" value={form.email} onChange={v => setForm(p=>({...p,email:v}))} type="email" />
            <Input label="Dirección" value={form.direccion} onChange={v => setForm(p=>({...p,direccion:v}))} className="col-span-2" />
          </div>
          {msg && <p className="text-red-600 text-sm mt-3">{msg}</p>}
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
            <Button onClick={guardar} icon={<Save size={14} />}>Guardar</Button>
          </div>
        </Modal>
      )}

      {/* Modal Historial */}
      {histModal && (
        <Modal title={`Historial · ${histModal.cliente.nombre}`} onClose={() => setHistModal(null)} size="lg">
          {histModal.ordenes.length === 0
            ? <p className="text-slate-400 text-center py-8">Sin órdenes registradas.</p>
            : <DataTable
                columns={[
                  { key:"numero_orden",label:"Orden",render:v=><span className="font-mono text-xs font-bold text-indigo-700">{v}</span> },
                  { key:"equipo_marca",label:"Equipo",render:(v,r)=>`${v} ${r.equipo_modelo}` },
                  { key:"estado",label:"Estado",render:v=><Badge className={ESTADO_COLORS[v]}>{ESTADO_LABELS[v]}</Badge> },
                  { key:"fecha_ingreso",label:"Ingreso",render:v=>fmtDate(v) },
                ]}
                data={histModal.ordenes}
              />
          }
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ÓRDENES
// ═══════════════════════════════════════════════════════════════════════════

function Ordenes({ user }) {
  const perms = PERMISOS[user.rol] || {};
  const [ordenes, setOrdenes]         = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [search, setSearch]           = useState("");
  const [detalle, setDetalle]         = useState(null);
  const [newModal, setNewModal]       = useState(false);
  const [pagoModal, setPagoModal]     = useState(null);
  const [repModal, setRepModal]       = useState(null);
  const [msg, setMsg]                 = useState("");

  // Formulario nueva orden
  const [form, setForm] = useState({ cliente_id:"", equipo_marca:"", equipo_modelo:"", imei:"", falla_reportada:"", tecnico_id:"", prioridad:"normal", valor_mano_obra:0, descuento:0 });
  // Búsqueda de repuestos
  const [busRep, setBusRep] = useState({ tipo:"", marca:"", modelo:"" });
  const [repResult, setRepResult] = useState(null);
  // Pago
  const [pagoForm, setPagoForm] = useState({ monto:0, metodo:"efectivo", notas:"" });

  const load = useCallback(() => {
    const ords = DB.getArr(DB.KEYS.ORDENES).filter(o => !o.deleted_at);
    const clientes = DB.getArr(DB.KEYS.CLIENTES);
    const enriched = ords.map(o => {
      const cli = clientes.find(c => c.id === o.cliente_id);
      return { ...o, cliente_nombre: cli?.nombre ?? "—", total: calcularTotalOrden(o.id), pagado: calcularPagadoOrden(o.id) };
    });
    setOrdenes(enriched);
  }, []);
  useEffect(load, [load]);

  const loadDetalle = useCallback(orden => {
    const oreps     = DB.getArr(DB.KEYS.ORDEN_REPUESTOS).filter(o => o.orden_id === orden.id);
    const repuestos = DB.getArr(DB.KEYS.REPUESTOS);
    const pagos     = DB.getArr(DB.KEYS.PAGOS).filter(p => p.orden_id === orden.id);
    const orepsEnrich = oreps.map(o => {
      const r = repuestos.find(r => r.id === o.repuesto_id);
      return { ...o, repuesto_codigo: r?.codigo_interno ?? "—", repuesto_label: r ? `${r.tipo} ${r.marca} ${r.modelo}` : "—" };
    });
    setDetalle({ ...orden, oreps: orepsEnrich, pagos, total: calcularTotalOrden(orden.id), pagado: calcularPagadoOrden(orden.id) });
  }, []);

  const filtered = ordenes.filter(o => {
    const matchEstado = filtroEstado === "todos" || o.estado === filtroEstado;
    const matchSearch = o.numero_orden.includes(search) || o.cliente_nombre.toLowerCase().includes(search.toLowerCase()) ||
      (o.equipo_marca+"").toLowerCase().includes(search.toLowerCase()) || (o.imei||"").includes(search);
    const matchRol = user.rol === "TEC" ? o.tecnico_id === user.id : true;
    return matchEstado && matchSearch && matchRol;
  });

  const avanzarEstado = orden => {
    const idx = ESTADOS_ORDEN.indexOf(orden.estado);
    if (idx >= ESTADOS_ORDEN.length - 2) return;
    const nuevo = ESTADOS_ORDEN[idx + 1];
    // Validaciones
    if (nuevo === "entregado") {
      const saldo = calcularTotalOrden(orden.id) - calcularPagadoOrden(orden.id);
      if (saldo > 0 && user.rol !== "ADM") { alert(`Saldo pendiente de ${fmt(saldo)}. Solo el ADM puede entregar con deuda.`); return; }
    }
    const arr = DB.getArr(DB.KEYS.ORDENES);
    const prev = arr.find(o => o.id === orden.id);
    const updated = arr.map(o => o.id === orden.id ? { ...o, estado: nuevo, fecha_entrega: nuevo === "entregado" ? todayISO() : o.fecha_entrega } : o);
    DB.setArr(DB.KEYS.ORDENES, updated);
    insertAuditLog({ usuarioId:user.id, accion:"UPDATE", entidad:"ordenes_reparacion", entidadId:orden.id, payload:{ antes:{estado:prev.estado}, despues:{estado:nuevo}, campos:["estado"] } });
    load();
    if (detalle?.id === orden.id) loadDetalle({ ...detalle, estado: nuevo });
  };

  const anular = orden => {
    const motivo = prompt("Motivo de anulación (obligatorio):");
    if (!motivo?.trim()) return;
    // Liberar reservas no instaladas
    const oreps = DB.getArr(DB.KEYS.ORDEN_REPUESTOS).filter(o => o.orden_id === orden.id && !o.instalado);
    const repuestos = DB.getArr(DB.KEYS.REPUESTOS);
    const updRep = repuestos.map(r => {
      const or = oreps.find(o => o.repuesto_id === r.id);
      if (!or) return r;
      return { ...r, stock_reservado: Math.max(0, r.stock_reservado - or.cantidad), reservado_hasta: null, reservado_por: null };
    });
    DB.setArr(DB.KEYS.REPUESTOS, updRep);
    const arr = DB.getArr(DB.KEYS.ORDENES);
    DB.setArr(DB.KEYS.ORDENES, arr.map(o => o.id === orden.id ? { ...o, estado:"anulado", motivo_anulacion:motivo } : o));
    insertAuditLog({ usuarioId:user.id, accion:"UPDATE", entidad:"ordenes_reparacion", entidadId:orden.id, payload:{ antes:{estado:orden.estado}, despues:{estado:"anulado",motivo_anulacion:motivo}, campos:["estado","motivo_anulacion"] } });
    load(); setDetalle(null);
  };

  const crearOrden = () => {
    if (!form.cliente_id) { setMsg("Selecciona un cliente."); return; }
    if (!form.equipo_marca.trim() || !form.equipo_modelo.trim()) { setMsg("Marca y modelo son requeridos."); return; }
    if (form.imei && (form.imei.length < 14 || form.imei.length > 16)) { setMsg("IMEI debe tener entre 14 y 16 dígitos."); return; }

    const numero = generarNumeroOrden();
    const nuevaOrden = {
      id: DB.nextId(DB.KEYS.ORDENES),
      numero_orden: numero,
      cliente_id: parseInt(form.cliente_id),
      equipo_marca: form.equipo_marca,
      equipo_modelo: form.equipo_modelo,
      imei: form.imei || null,
      estado: "recibido",
      falla_reportada: form.falla_reportada,
      diagnostico: null,
      tecnico_id: form.tecnico_id ? parseInt(form.tecnico_id) : null,
      prioridad: form.prioridad,
      fecha_ingreso: todayISO(),
      fecha_entrega: null,
      valor_mano_obra: parseFloat(form.valor_mano_obra) || 0,
      descuento: parseFloat(form.descuento) || 0,
      garantia_dias: DB.get(DB.KEYS.CONFIG)?.garantia_taller_dias ?? 30,
      motivo_anulacion: null,
      deleted_at: null,
      created_by: user.id,
      created_at: todayISO(),
    };
    const arr = DB.getArr(DB.KEYS.ORDENES);
    DB.setArr(DB.KEYS.ORDENES, [...arr, nuevaOrden]);
    insertAuditLog({ usuarioId:user.id, accion:"CREATE", entidad:"ordenes_reparacion", entidadId:nuevaOrden.id, payload:{ antes:null, despues:nuevaOrden, campos:Object.keys(nuevaOrden) } });
    load(); setNewModal(false);
    setForm({ cliente_id:"", equipo_marca:"", equipo_modelo:"", imei:"", falla_reportada:"", tecnico_id:"", prioridad:"normal", valor_mano_obra:0, descuento:0 });
    setMsg("");
  };

  const buscarRepuesto = () => {
    if (!busRep.tipo || !busRep.marca || !busRep.modelo) { alert("Completa tipo, marca y modelo para buscar."); return; }
    const r = seleccionarRepuestoFIFO(busRep.tipo, busRep.marca, busRep.modelo, 1);
    setRepResult(r || null);
    if (!r) alert("Sin stock disponible para esa combinación.");
  };

  const asignarRepuesto = () => {
    if (!repResult) return;
    const cfg = DB.get(DB.KEYS.CONFIG);
    const factor = cfg?.factor_instalacion ?? 1.5;
    const valorUnitario = repResult.costo_unitario * factor;
    try {
      reservarRepuesto(repResult.id, repModal.id, 1, user.id, valorUnitario);
      insertAuditLog({ usuarioId:user.id, accion:"UPDATE", entidad:"repuestos", entidadId:repResult.id, payload:{ antes:{stock_reservado:repResult.stock_reservado}, despues:{stock_reservado:repResult.stock_reservado+1}, campos:["stock_reservado"] } });
      load(); loadDetalle(repModal); setRepModal(null); setBusRep({tipo:"",marca:"",modelo:""}); setRepResult(null);
    } catch(e) { alert(e.message); }
  };

  const instalar = (orden, orep) => {
    try {
      instalarRepuesto(orep.repuesto_id, orden.id, orep.cantidad, user.id);
      insertAuditLog({ usuarioId:user.id, accion:"UPDATE", entidad:"orden_repuestos", entidadId:orep.id, payload:{ antes:{instalado:0}, despues:{instalado:1}, campos:["instalado"] } });
      load(); loadDetalle(orden);
    } catch(e) { alert(e.message); }
  };

  const pagarOrden = () => {
    const monto = parseFloat(pagoForm.monto);
    if (!monto || monto <= 0) { alert("Monto inválido."); return; }
    const total  = calcularTotalOrden(pagoModal.id);
    const pagado = calcularPagadoOrden(pagoModal.id);
    if (pagado + monto > total + 0.01) { alert(`El monto supera el saldo pendiente de ${fmt(total - pagado)}.`); return; }
    registrarPago(pagoModal.id, monto, pagoForm.metodo, pagoForm.notas, user.id);
    insertAuditLog({ usuarioId:user.id, accion:"CREATE", entidad:"pagos", entidadId:null, payload:{ antes:null, despues:{orden_id:pagoModal.id, monto, metodo:pagoForm.metodo}, campos:["monto","metodo"] } });
    load(); loadDetalle(pagoModal); setPagoModal(null); setPagoForm({ monto:0, metodo:"efectivo", notas:"" });
  };

  const clientes  = DB.getArr(DB.KEYS.CLIENTES).filter(c => !c.deleted_at);
  const tecnicos  = DB.getArr(DB.KEYS.USUARIOS).filter(u => u.activo && ["TEC","ADM"].includes(u.rol));

  return (
    <div className="page-enter">
      <PageHeader title="Órdenes de Reparación" subtitle={`${filtered.length} de ${ordenes.length} órdenes`}
        actions={perms.ordenes_crear && <Button onClick={() => { setNewModal(true); setMsg(""); }} icon={<Plus size={16} />}>Nueva orden</Button>}
      />
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        {["todos",...ESTADOS_ORDEN].map(e => (
          <button key={e} onClick={() => setFiltroEstado(e)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filtroEstado === e ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {e === "todos" ? "Todos" : ESTADO_LABELS[e]}
            {e !== "todos" && <span className="ml-1.5 opacity-70">{ordenes.filter(o => o.estado === e).length}</span>}
          </button>
        ))}
      </div>

      <Card>
        <div className="p-4 border-b border-slate-200">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar orden, cliente, equipo, IMEI..." />
        </div>
        <DataTable
          onRowClick={o => loadDetalle(o)}
          columns={[
            { key:"numero_orden", label:"N° Orden", render:v=><span className="font-mono text-xs font-bold text-indigo-700">{v}</span> },
            { key:"cliente_nombre", label:"Cliente" },
            { key:"equipo_marca", label:"Equipo", render:(v,r)=>`${v} ${r.equipo_modelo}` },
            { key:"estado", label:"Estado", render:v=><Badge className={ESTADO_COLORS[v]}>{ESTADO_LABELS[v]}</Badge> },
            { key:"prioridad", label:"Prioridad", render:v=>v!=="normal"?<Badge className={v==="urgente"?"bg-orange-100 text-orange-700":"bg-violet-100 text-violet-700"}>{v}</Badge>:null },
            { key:"total", label:"Total", render:v=>v>0?<span className="font-semibold">{fmt(v)}</span>:"—" },
            { key:"pagado", label:"Pagado", render:(v,r)=>r.total>0?<span className={v>=r.total?"text-emerald-600 font-semibold":"text-amber-600 font-semibold"}>{fmt(v)}</span>:"—" },
            { key:"fecha_ingreso", label:"Ingreso", render:v=>fmtDate(v) },
          ]}
          data={filtered}
        />
      </Card>

      {/* Modal Detalle */}
      {detalle && (
        <Modal title={`Orden ${detalle.numero_orden}`} onClose={() => setDetalle(null)} size="xl">
          <div className="space-y-5">
            {/* Acciones de estado */}
            <div className="flex flex-wrap gap-2 items-center">
              <Badge className={`${ESTADO_COLORS[detalle.estado]} text-sm px-3 py-1`}>{ESTADO_LABELS[detalle.estado]}</Badge>
              {detalle.estado !== "anulado" && detalle.estado !== "entregado" && (
                <>
                  <Button size="sm" variant="success" onClick={() => avanzarEstado(detalle)} icon={<ChevronRight size={14} />}>
                    → {ESTADO_LABELS[ESTADOS_ORDEN[ESTADOS_ORDEN.indexOf(detalle.estado)+1]]}
                  </Button>
                  {perms.ordenes_anular && <Button size="sm" variant="danger" onClick={() => anular(detalle)} icon={<XCircle size={14} />}>Anular</Button>}
                  <Button size="sm" variant="secondary" onClick={() => { setRepModal(detalle); setBusRep({tipo:"",marca:"",modelo:""}); setRepResult(null); }} icon={<Plus size={14} />}>Agregar repuesto</Button>
                </>
              )}
              {perms.pagos && detalle.total > detalle.pagado && detalle.estado !== "anulado" && (
                <Button size="sm" variant="warning" onClick={() => { setPagoModal(detalle); setPagoForm({monto: detalle.total - detalle.pagado, metodo:"efectivo", notas:""}); }} icon={<CreditCard size={14} />}>Registrar pago</Button>
              )}
            </div>

            {/* Info equipo */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              {[["Cliente", detalle.cliente_nombre], ["Equipo", `${detalle.equipo_marca} ${detalle.equipo_modelo}`], ["IMEI", detalle.imei || "N/A"], ["Ingreso", fmtDate(detalle.fecha_ingreso)], ["Falla", detalle.falla_reportada || "—"], ["Mano de obra", fmt(detalle.valor_mano_obra)], ["Descuento", `${detalle.descuento}%`], ["Prioridad", detalle.prioridad]].map(([k,v]) => (
                <div key={k}><p className="text-xs text-slate-400 font-semibold uppercase mb-0.5">{k}</p><p className="font-semibold text-slate-800">{v}</p></div>
              ))}
            </div>

            {/* Resumen financiero */}
            <div className="flex gap-6 p-4 bg-slate-50 rounded-xl">
              <div><p className="text-xs text-slate-500 uppercase">Total</p><p className="text-2xl font-black text-indigo-700">{fmt(detalle.total)}</p></div>
              <div><p className="text-xs text-slate-500 uppercase">Pagado</p><p className={`text-2xl font-black ${detalle.pagado >= detalle.total && detalle.total > 0 ? "text-emerald-600" : "text-amber-600"}`}>{fmt(detalle.pagado)}</p></div>
              <div><p className="text-xs text-slate-500 uppercase">Pendiente</p><p className="text-2xl font-black text-red-500">{fmt(Math.max(0, detalle.total - detalle.pagado))}</p></div>
            </div>

            {/* Repuestos asignados */}
            <div>
              <p className="text-sm font-bold text-slate-700 mb-2">Repuestos asignados</p>
              {detalle.oreps.length === 0
                ? <p className="text-sm text-slate-400">Sin repuestos asignados.</p>
                : <DataTable
                    columns={[
                      { key:"repuesto_codigo",label:"Código",render:v=><span className="font-mono text-xs text-indigo-700">{v}</span> },
                      { key:"repuesto_label", label:"Descripción" },
                      { key:"cantidad",       label:"Cant" },
                      { key:"valor_unitario", label:"Valor",  render:v=>fmt(v) },
                      { key:"instalado",      label:"Estado", render:v=><Badge className={v?"bg-green-100 text-green-700":"bg-amber-100 text-amber-700"}>{v?"Instalado":"Reservado"}</Badge> },
                      { key:"accion", label:"", render:(_,r)=>!r.instalado && perms.repuestos_instalar
                        ? <Button size="sm" onClick={() => instalar(detalle, r)} icon={<Check size={12} />}>Instalar</Button>
                        : null
                      },
                    ]}
                    data={detalle.oreps}
                  />
              }
            </div>

            {/* Pagos */}
            <div>
              <p className="text-sm font-bold text-slate-700 mb-2">Historial de pagos</p>
              {detalle.pagos.length === 0
                ? <p className="text-sm text-slate-400">Sin pagos registrados.</p>
                : <DataTable
                    columns={[
                      { key:"monto",  label:"Monto",  render:v=><span className="font-semibold text-emerald-700">{fmt(v)}</span> },
                      { key:"metodo", label:"Método", render:v=><Badge className="bg-slate-100 text-slate-600 capitalize">{v}</Badge> },
                      { key:"notas",  label:"Notas" },
                      { key:"fecha",  label:"Fecha",  render:v=>fmtDate(v) },
                    ]}
                    data={detalle.pagos}
                  />
              }
            </div>

            {/* Timeline de flujo */}
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 mb-3">Flujo de estado</p>
              <div className="flex items-center gap-1 flex-wrap">
                {ESTADOS_ORDEN.slice(0,-1).map((e, i) => {
                  const idx = ESTADOS_ORDEN.indexOf(detalle.estado);
                  const done = i < idx;
                  const active = i === idx;
                  return (
                    <div key={e} className="flex items-center gap-1">
                      <div className={`px-2 py-1 rounded text-xs font-semibold ${active ? "bg-indigo-600 text-white" : done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                        {done && <Check size={10} className="inline mr-1" />}{ESTADO_LABELS[e]}
                      </div>
                      {i < ESTADOS_ORDEN.length - 2 && <ChevronRight size={12} className="text-slate-300" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal nueva orden */}
      {newModal && (
        <Modal title="Nueva orden de reparación" onClose={() => setNewModal(false)} size="lg">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Cliente *" value={form.cliente_id} onChange={v => setForm(p=>({...p,cliente_id:v}))} className="col-span-2"
              options={[{value:"",label:"— Seleccionar cliente —"},...clientes.map(c=>({value:String(c.id),label:`${c.nombre} · ${c.telefono}`}))]} />
            <Input label="Marca del equipo *" value={form.equipo_marca} onChange={v=>setForm(p=>({...p,equipo_marca:v}))} placeholder="Samsung, iPhone..." />
            <Input label="Modelo *" value={form.equipo_modelo} onChange={v=>setForm(p=>({...p,equipo_modelo:v}))} placeholder="Galaxy S23, 14 Pro..." />
            <Input label="IMEI (opcional)" value={form.imei} onChange={v=>setForm(p=>({...p,imei:v}))} hint="14–16 dígitos" className="col-span-2" />
            <Textarea label="Falla reportada" value={form.falla_reportada} onChange={v=>setForm(p=>({...p,falla_reportada:v}))} className="col-span-2" />
            <Select label="Técnico asignado" value={form.tecnico_id} onChange={v=>setForm(p=>({...p,tecnico_id:v}))}
              options={[{value:"",label:"— Sin asignar —"},...tecnicos.map(t=>({value:String(t.id),label:t.nombre}))]} />
            <Select label="Prioridad" value={form.prioridad} onChange={v=>setForm(p=>({...p,prioridad:v}))}
              options={[{value:"normal",label:"Normal"},{value:"urgente",label:"Urgente"},{value:"vip",label:"VIP"}]} />
            <Input label="Mano de obra ($)" value={form.valor_mano_obra} onChange={v=>setForm(p=>({...p,valor_mano_obra:v}))} type="number" />
            <Input label="Descuento (%)" value={form.descuento} onChange={v=>setForm(p=>({...p,descuento:v}))} type="number" hint="0–100" />
          </div>
          {msg && <p className="text-red-600 text-sm mt-3">{msg}</p>}
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={() => setNewModal(false)}>Cancelar</Button>
            <Button onClick={crearOrden} icon={<Plus size={14} />}>Crear orden</Button>
          </div>
        </Modal>
      )}

      {/* Modal asignar repuesto (FIFO — sección 6.1) */}
      {repModal && (
        <Modal title="Asignar repuesto — selección FIFO" onClose={() => setRepModal(null)} size="lg">
          <AlertBanner type="info">El sistema selecciona automáticamente el repuesto del <strong>lote más antiguo</strong> (FIFO) con stock disponible.</AlertBanner>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Input label="Tipo" value={busRep.tipo} onChange={v=>setBusRep(p=>({...p,tipo:v}))} placeholder="Pantalla, Batería..." />
            <Input label="Marca" value={busRep.marca} onChange={v=>setBusRep(p=>({...p,marca:v}))} placeholder="Samsung..." />
            <Input label="Modelo" value={busRep.modelo} onChange={v=>setBusRep(p=>({...p,modelo:v}))} placeholder="Galaxy S23..." />
          </div>
          <Button onClick={buscarRepuesto} icon={<Search size={14} />}>Buscar disponibilidad</Button>
          {repResult && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="font-bold text-emerald-800 mb-2">✓ Repuesto disponible (FIFO)</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-500">Código:</span> <span className="font-mono font-bold">{repResult.codigo_interno}</span></div>
                <div><span className="text-slate-500">Tipo:</span> {repResult.tipo}</div>
                <div><span className="text-slate-500">Marca/Modelo:</span> {repResult.marca} {repResult.modelo}</div>
                <div><span className="text-slate-500">Disponible:</span> <span className="font-bold text-emerald-700">{repResult.stock - repResult.stock_reservado}</span></div>
                <div><span className="text-slate-500">Precio venta:</span> <span className="font-bold">{fmt(repResult.costo_unitario * (DB.get(DB.KEYS.CONFIG)?.factor_instalacion ?? 1.5))}</span></div>
                <div><span className="text-slate-500">Calidad:</span> <Badge className="bg-blue-100 text-blue-700">{repResult.calidad}</Badge></div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={asignarRepuesto} icon={<Check size={14} />}>Confirmar reserva</Button>
                <Button variant="secondary" onClick={() => setRepResult(null)}>Cancelar</Button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Modal pago */}
      {pagoModal && (
        <Modal title={`Registrar pago — ${pagoModal.numero_orden}`} onClose={() => setPagoModal(null)} size="sm">
          <div className="space-y-4">
            <div className="flex gap-4 text-sm">
              <div><p className="text-slate-500">Total</p><p className="font-bold text-lg">{fmt(pagoModal.total)}</p></div>
              <div><p className="text-slate-500">Pendiente</p><p className="font-bold text-lg text-amber-600">{fmt(Math.max(0, pagoModal.total - pagoModal.pagado))}</p></div>
            </div>
            <Input label="Monto ($)" value={pagoForm.monto} onChange={v=>setPagoForm(p=>({...p,monto:v}))} type="number" required />
            <Select label="Método de pago" value={pagoForm.metodo} onChange={v=>setPagoForm(p=>({...p,metodo:v}))}
              options={[{value:"efectivo",label:"Efectivo"},{value:"tarjeta",label:"Tarjeta"},{value:"transferencia",label:"Transferencia"},{value:"otros",label:"Otros"}]} />
            <Input label="Notas" value={pagoForm.notas} onChange={v=>setPagoForm(p=>({...p,notas:v}))} />
          </div>
          <div className="flex gap-2 mt-6">
            <Button variant="secondary" className="flex-1 justify-center" onClick={() => setPagoModal(null)}>Cancelar</Button>
            <Button className="flex-1 justify-center" onClick={pagarOrden} icon={<Check size={14} />}>Registrar</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INVENTARIO / REPUESTOS
// ═══════════════════════════════════════════════════════════════════════════

function Inventario({ user }) {
  const perms = PERMISOS[user.rol] || {};
  const [repuestos, setRepuestos] = useState([]);
  const [search, setSearch]       = useState("");
  const [kardexModal, setKardexModal] = useState(null);
  const [ajusteModal, setAjusteModal] = useState(null);
  const [ajusteForm, setAjusteForm]   = useState({ tipo:"ajuste_entrada", cantidad:1, motivo:"" });
  const [newModal, setNewModal]   = useState(false);
  const [form, setForm] = useState({ tipo:"",marca:"",modelo:"",calidad:"compatible",ubicacion:"",costo_unitario:0,stock_inicial:1 });
  const [msg, setMsg] = useState("");

  const load = () => {
    const reps  = DB.getArr(DB.KEYS.REPUESTOS).filter(r => !r.deleted_at);
    const lotes = DB.getArr(DB.KEYS.LOTES);
    const enriched = reps.map(r => {
      const lote = lotes.find(l => l.id === r.lote_id);
      return { ...r, costo_unitario: lote?.costo_unitario ?? 0, lote_ref: lote?.referencia ?? "—", precio_venta: (lote?.costo_unitario ?? 0) * (DB.get(DB.KEYS.CONFIG)?.factor_instalacion ?? 1.5) };
    });
    setRepuestos(enriched);
  };
  useEffect(load, []);

  const cfg       = DB.get(DB.KEYS.CONFIG);
  const stockMin  = cfg?.stock_minimo_global ?? 2;
  const filtered  = repuestos.filter(r =>
    r.codigo_interno.toLowerCase().includes(search.toLowerCase()) ||
    r.tipo.toLowerCase().includes(search.toLowerCase()) ||
    r.marca.toLowerCase().includes(search.toLowerCase()) ||
    r.modelo.toLowerCase().includes(search.toLowerCase())
  );

  const CALIDAD_COLORS = { original:"bg-emerald-100 text-emerald-700", compatible:"bg-blue-100 text-blue-700", remanufacturado:"bg-amber-100 text-amber-700" };

  const agregarAjuste = () => {
    if (!ajusteForm.motivo.trim()) { alert("Motivo es obligatorio para ajustes de kardex."); return; }
    const cant = parseInt(ajusteForm.cantidad);
    if (!cant || cant <= 0) { alert("Cantidad debe ser > 0"); return; }
    const rep = DB.getArr(DB.KEYS.REPUESTOS).find(r => r.id === ajusteModal.id);
    // Validar stock no negativo en ajuste_salida
    if ((ajusteForm.tipo === "ajuste_salida" || ajusteForm.tipo === "perdida") && rep.stock < cant) { alert("Stock insuficiente para ese ajuste."); return; }
    // Kardex (inmutable — solo push)
    const kardex = DB.getArr(DB.KEYS.KARDEX);
    kardex.push({ id: DB.nextId(DB.KEYS.KARDEX), repuesto_id: ajusteModal.id, tipo: ajusteForm.tipo, cantidad: cant, orden_id: null, usuario_id: user.id, motivo: ajusteForm.motivo, created_at: todayISO() });
    DB.setArr(DB.KEYS.KARDEX, kardex);
    // Actualizar stock (trigger equivalente)
    const delta = ["ajuste_entrada"].includes(ajusteForm.tipo) ? cant : -cant;
    const reps  = DB.getArr(DB.KEYS.REPUESTOS).map(r => r.id === ajusteModal.id ? { ...r, stock: r.stock + delta } : r);
    DB.setArr(DB.KEYS.REPUESTOS, reps);
    insertAuditLog({ usuarioId:user.id, accion:"UPDATE", entidad:"repuestos", entidadId:ajusteModal.id, payload:{ antes:{stock:rep.stock}, despues:{stock:rep.stock+delta}, campos:["stock"] } });
    load(); setAjusteModal(null); setAjusteForm({ tipo:"ajuste_entrada", cantidad:1, motivo:"" });
  };

  const crearRepuesto = () => {
    if (!form.tipo.trim() || !form.marca.trim() || !form.modelo.trim()) { setMsg("Tipo, marca y modelo son requeridos."); return; }
    const codigo = generarCodigoRepuesto();
    const lotes  = DB.getArr(DB.KEYS.LOTES);
    // Usar lote apertura o crear uno
    let loteId = 1;
    if (!lotes.find(l => l.id === 1)) loteId = lotes[0]?.id ?? 1;

    const stockInicial = parseInt(form.stock_inicial) || 1;
    const nuevo = {
      id: DB.nextId(DB.KEYS.REPUESTOS),
      codigo_interno: codigo,
      tipo: form.tipo, marca: form.marca, modelo: form.modelo,
      lote_id: loteId,
      stock: stockInicial, stock_reservado: 0,
      ubicacion: form.ubicacion || null,
      calidad: form.calidad,
      imagen: null, deleted_at: null,
      created_at: todayISO(),
    };
    // Si se especificó costo, actualizar el lote
    if (form.costo_unitario > 0) {
      const newLote = { id: DB.nextId(DB.KEYS.LOTES), referencia: `COMPRA-${codigo}`, proveedor_id: 1, fecha_compra: new Date().toISOString().slice(0,10), factura: null, cantidad: stockInicial, costo_unitario: parseFloat(form.costo_unitario), created_at: todayISO() };
      DB.setArr(DB.KEYS.LOTES, [...lotes, newLote]);
      nuevo.lote_id = newLote.id;
    }
    DB.setArr(DB.KEYS.REPUESTOS, [...DB.getArr(DB.KEYS.REPUESTOS), nuevo]);
    // Kardex entrada inicial
    const kardex = DB.getArr(DB.KEYS.KARDEX);
    kardex.push({ id: DB.nextId(DB.KEYS.KARDEX), repuesto_id: nuevo.id, tipo: "entrada", cantidad: stockInicial, orden_id: null, usuario_id: user.id, motivo: "Registro inicial de repuesto", created_at: todayISO() });
    DB.setArr(DB.KEYS.KARDEX, kardex);
    insertAuditLog({ usuarioId:user.id, accion:"CREATE", entidad:"repuestos", entidadId:nuevo.id, payload:{ antes:null, despues:nuevo, campos:Object.keys(nuevo) } });
    load(); setNewModal(false); setMsg(""); setForm({ tipo:"",marca:"",modelo:"",calidad:"compatible",ubicacion:"",costo_unitario:0,stock_inicial:1 });
  };

  return (
    <div className="page-enter">
      <PageHeader title="Inventario de Repuestos" subtitle={`${filtered.length} repuestos · Factor instalación: ×${cfg?.factor_instalacion ?? 1.5}`}
        actions={<>
          {perms.inventario_ingresar && <Button onClick={() => setNewModal(true)} icon={<Plus size={16} />}>Nuevo repuesto</Button>}
        </>}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Total repuestos"    value={repuestos.length}                                                          icon={Package}       color="indigo" />
        <KpiCard title="Stock disponible"   value={repuestos.reduce((s,r)=>s+(r.stock-r.stock_reservado),0)}                  icon={CheckCircle}   color="green" />
        <KpiCard title="Reservados"         value={repuestos.reduce((s,r)=>s+r.stock_reservado,0)}                            icon={Clock}         color="amber" />
        <KpiCard title="Bajo mínimo"        value={repuestos.filter(r=>(r.stock-r.stock_reservado)<=stockMin).length}         icon={AlertTriangle} color="red" />
      </div>
      <Card>
        <div className="p-4 border-b border-slate-200">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar código, tipo, marca, modelo..." />
        </div>
        <DataTable
          columns={[
            { key:"codigo_interno", label:"Código",    render:v=><span className="font-mono text-xs font-bold text-indigo-700">{v}</span> },
            { key:"tipo",    label:"Tipo" },
            { key:"marca",   label:"Marca" },
            { key:"modelo",  label:"Modelo" },
            { key:"calidad", label:"Calidad",  render:v=><Badge className={CALIDAD_COLORS[v] || "bg-slate-100 text-slate-600"}>{v}</Badge> },
            { key:"stock",          label:"Stock",     render:(v,r)=><span className="font-bold">{v}</span> },
            { key:"stock_reservado",label:"Reservado", render:v=><span className="text-amber-600 font-semibold">{v}</span> },
            { key:"stock_disp",     label:"Disponible",render:(_,r)=>{const d=r.stock-r.stock_reservado;return <span className={`font-bold ${d<=stockMin?"text-red-600":d<=stockMin*2?"text-amber-600":"text-emerald-600"}`}>{d}</span>;} },
            { key:"precio_venta", label:"Precio venta", render:v=><span className="font-semibold text-indigo-700">{fmt(v)}</span> },
            { key:"ubicacion",    label:"Ubic.",  render:v=>v?<Badge className="bg-slate-100 text-slate-600">{v}</Badge>:"—" },
            { key:"acciones",     label:"", render:(_,row)=>(
              <div className="flex gap-1" onClick={e=>e.stopPropagation()}>
                <button onClick={()=>setKardexModal(row)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-indigo-600" title="Ver kardex"><BookOpen size={14} /></button>
                {perms.inventario_ajuste && <button onClick={()=>{ setAjusteModal(row); setAjusteForm({tipo:"ajuste_entrada",cantidad:1,motivo:""}); }} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-amber-600" title="Ajuste"><RefreshCw size={14} /></button>}
              </div>
            )},
          ]}
          data={filtered}
        />
      </Card>

      {/* Kardex modal */}
      {kardexModal && (
        <Modal title={`Kardex · ${kardexModal.codigo_interno} — ${kardexModal.tipo} ${kardexModal.marca} ${kardexModal.modelo}`} onClose={() => setKardexModal(null)} size="lg">
          <AlertBanner type="info">Los movimientos de kardex son <strong>inmutables</strong>. Para corregir errores use ajuste_entrada o ajuste_salida.</AlertBanner>
          <DataTable
            columns={[
              { key:"tipo",      label:"Tipo", render:v=>{
                const c={entrada:"bg-emerald-100 text-emerald-700",salida:"bg-red-100 text-red-700",ajuste_entrada:"bg-blue-100 text-blue-700",ajuste_salida:"bg-amber-100 text-amber-700",perdida:"bg-slate-100 text-slate-600"};
                const l={entrada:"Entrada",salida:"Salida",ajuste_entrada:"Ajuste (+)",ajuste_salida:"Ajuste (−)",perdida:"Pérdida"};
                return <Badge className={c[v]||"bg-slate-100"}>{l[v]||v}</Badge>;
              }},
              { key:"cantidad",  label:"Cantidad", render:(v,r)=><span className={`font-bold ${["entrada","ajuste_entrada"].includes(r.tipo)?"text-emerald-600":"text-red-600"}`}>{["entrada","ajuste_entrada"].includes(r.tipo)?"+":"-"}{v}</span> },
              { key:"motivo",    label:"Motivo" },
              { key:"created_at",label:"Fecha",    render:v=>fmtDate(v) },
            ]}
            data={DB.getArr(DB.KEYS.KARDEX).filter(k => k.repuesto_id === kardexModal.id).sort((a,b)=>b.id-a.id)}
          />
        </Modal>
      )}

      {/* Ajuste modal */}
      {ajusteModal && (
        <Modal title={`Ajuste de inventario · ${ajusteModal.codigo_interno}`} onClose={() => setAjusteModal(null)} size="sm">
          <p className="text-sm text-slate-500 mb-4">Stock actual: <strong>{ajusteModal.stock}</strong> · Disponible: <strong>{ajusteModal.stock - ajusteModal.stock_reservado}</strong></p>
          <div className="space-y-4">
            <Select label="Tipo de ajuste" value={ajusteForm.tipo} onChange={v=>setAjusteForm(p=>({...p,tipo:v}))}
              options={[{value:"ajuste_entrada",label:"Ajuste entrada (+)"},{value:"ajuste_salida",label:"Ajuste salida (−)"},{value:"perdida",label:"Pérdida / Extravío"}]} />
            <Input label="Cantidad" value={ajusteForm.cantidad} onChange={v=>setAjusteForm(p=>({...p,cantidad:v}))} type="number" hint="Siempre positiva" />
            <Input label="Motivo (obligatorio)" value={ajusteForm.motivo} onChange={v=>setAjusteForm(p=>({...p,motivo:v}))} placeholder="Ej: Conteo físico, rotura..." required />
          </div>
          <div className="flex gap-2 mt-6">
            <Button variant="secondary" className="flex-1 justify-center" onClick={() => setAjusteModal(null)}>Cancelar</Button>
            <Button className="flex-1 justify-center" onClick={agregarAjuste} icon={<Check size={14} />}>Registrar</Button>
          </div>
        </Modal>
      )}

      {/* Nuevo repuesto */}
      {newModal && (
        <Modal title="Nuevo repuesto" onClose={() => setNewModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Tipo *" value={form.tipo} onChange={v=>setForm(p=>({...p,tipo:v}))} placeholder="Pantalla, Batería..." required className="col-span-2" />
            <Input label="Marca *" value={form.marca} onChange={v=>setForm(p=>({...p,marca:v}))} required />
            <Input label="Modelo *" value={form.modelo} onChange={v=>setForm(p=>({...p,modelo:v}))} required />
            <Select label="Calidad" value={form.calidad} onChange={v=>setForm(p=>({...p,calidad:v}))}
              options={[{value:"original",label:"Original"},{value:"compatible",label:"Compatible"},{value:"remanufacturado",label:"Remanufacturado"}]} />
            <Input label="Ubicación física" value={form.ubicacion} onChange={v=>setForm(p=>({...p,ubicacion:v}))} placeholder="A-01, B-03..." />
            <Input label="Costo unitario ($)" value={form.costo_unitario} onChange={v=>setForm(p=>({...p,costo_unitario:v}))} type="number" />
            <Input label="Stock inicial" value={form.stock_inicial} onChange={v=>setForm(p=>({...p,stock_inicial:v}))} type="number" />
          </div>
          {msg && <p className="text-red-600 text-sm mt-3">{msg}</p>}
          <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
            <strong>Precio venta estimado:</strong> {fmt((form.costo_unitario || 0) * (cfg?.factor_instalacion ?? 1.5))} (costo × {cfg?.factor_instalacion ?? 1.5})
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={() => setNewModal(false)}>Cancelar</Button>
            <Button onClick={crearRepuesto} icon={<Plus size={14} />}>Registrar repuesto</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CAJA — movimientos_caja como fuente de verdad [VAL-04]
// ═══════════════════════════════════════════════════════════════════════════

function Caja({ user }) {
  const perms = PERMISOS[user.rol] || {};
  const [caja, setCaja]       = useState(null);
  const [movs, setMovs]       = useState([]);
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState({ tipo:"egreso", monto:0, concepto:"", metodo:"efectivo" });

  const load = () => {
    setCaja(DB.get(DB.KEYS.CAJA));
    setMovs(DB.getArr(DB.KEYS.MOV_CAJA).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
  };
  useEffect(load, []);

  const saldo = calcularSaldoCaja();
  const ingresos = movs.filter(m => m.tipo === "ingreso").reduce((s,m) => s + m.monto, 0);
  const egresos  = movs.filter(m => m.tipo === "egreso").reduce((s,m) => s + m.monto, 0);

  const registrarEgreso = () => {
    const monto = parseFloat(form.monto);
    if (!monto || monto <= 0) { alert("Monto inválido."); return; }
    if (!form.concepto.trim()) { alert("Concepto es requerido."); return; }
    const arr = DB.getArr(DB.KEYS.MOV_CAJA);
    arr.push({ id: DB.nextId(DB.KEYS.MOV_CAJA), tipo:"egreso", monto, concepto:form.concepto, referencia:null, usuario_id:user.id, metodo:form.metodo, created_at: todayISO() });
    DB.setArr(DB.KEYS.MOV_CAJA, arr);
    insertAuditLog({ usuarioId:user.id, accion:"CREATE", entidad:"movimientos_caja", entidadId:null, payload:{ antes:null, despues:{tipo:"egreso",monto,concepto:form.concepto}, campos:["tipo","monto","concepto"] } });
    load(); setModal(null); setForm({ tipo:"egreso", monto:0, concepto:"", metodo:"efectivo" });
  };

  const cerrarCaja = () => {
    if (!confirm("¿Cerrar la caja del día? Esta operación queda registrada.")) return;
    DB.set(DB.KEYS.CAJA, { ...caja, abierta:false, saldo_final: saldo, cerrado_por: user.id });
    insertAuditLog({ usuarioId:user.id, accion:"CONFIG_CHANGE", entidad:"caja", entidadId:null, payload:{ antes:{abierta:true}, despues:{abierta:false,saldo_final:saldo}, campos:["abierta","saldo_final"] } });
    load();
  };

  const abrirNuevaCaja = () => {
    const ini = parseFloat(prompt("Saldo inicial de caja ($):") || "0") || 0;
    DB.set(DB.KEYS.CAJA, { fecha: new Date().toISOString().slice(0,10), saldo_inicial: ini, cerrado_por:null, saldo_final:null, abierta:true, created_at: todayISO() });
    DB.setArr(DB.KEYS.MOV_CAJA, []);
    load();
  };

  const exportCSV = () => {
    const cols = ["id","tipo","monto","concepto","metodo","created_at"];
    const rows = movs.map(m => cols.map(k => `"${(m[k]||"").toString().replace(/"/g,'""')}"`).join(","));
    const blob = new Blob([cols.join(",")+"\n"+rows.join("\n")], { type:"text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `caja-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  return (
    <div className="page-enter">
      <PageHeader title="Caja" subtitle={`${caja?.fecha ?? "—"} · ${caja?.abierta ? "🟢 Abierta" : "🔴 Cerrada"}`}
        actions={<>
          <Button variant="secondary" size="sm" onClick={exportCSV} icon={<Download size={14} />}>CSV</Button>
          {perms.caja && caja?.abierta && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setModal("egreso")} icon={<TrendingDown size={14} />}>Registrar egreso</Button>
              <Button variant="danger" size="sm" onClick={cerrarCaja} icon={<Lock size={14} />}>Cerrar caja</Button>
            </>
          )}
          {perms.caja && !caja?.abierta && <Button size="sm" onClick={abrirNuevaCaja} icon={<Unlock size={14} />}>Abrir caja</Button>}
        </>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Saldo apertura" value={fmt(caja?.saldo_inicial ?? 0)} icon={Banknote}    color="indigo" />
        <KpiCard title="Ingresos"       value={fmt(ingresos)}                 icon={TrendingUp}  color="green" />
        <KpiCard title="Egresos"        value={fmt(egresos)}                  icon={TrendingDown} color="red" />
        <KpiCard title="Saldo actual"   value={fmt(saldo)}                    icon={DollarSign}  color="amber" />
      </div>

      <Card>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800">Movimientos del día</h3>
            <p className="text-xs text-slate-500 mt-0.5">Fuente de verdad contable · Registros inmutables [VAL-04]</p>
          </div>
        </div>
        <DataTable
          columns={[
            { key:"created_at", label:"Hora",    render:v=>new Date(v).toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"}) },
            { key:"tipo",       label:"Tipo",    render:v=><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${v==="ingreso"?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-700"}`}>{v==="ingreso"?<ArrowUpRight size={12}/>:<ArrowDownRight size={12}/>}{v}</span> },
            { key:"monto",      label:"Monto",   render:(v,r)=><span className={`font-bold text-base ${r.tipo==="ingreso"?"text-emerald-700":"text-red-700"}`}>{r.tipo==="ingreso"?"+":"−"}{fmt(v)}</span> },
            { key:"concepto",   label:"Concepto" },
            { key:"metodo",     label:"Método",  render:v=><Badge className="bg-slate-100 text-slate-600 capitalize">{v}</Badge> },
          ]}
          data={movs}
        />
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end items-center gap-6">
          <div className="text-sm text-slate-500">Balance del día</div>
          <div className={`text-xl font-black ${saldo >= (caja?.saldo_inicial ?? 0) ? "text-emerald-700" : "text-red-700"}`}>{fmt(saldo)}</div>
        </div>
      </Card>

      {modal === "egreso" && (
        <Modal title="Registrar egreso de caja" onClose={() => setModal(null)} size="sm">
          <div className="space-y-4">
            <Input label="Concepto *" value={form.concepto} onChange={v=>setForm(p=>({...p,concepto:v}))} placeholder="Compra repuestos, gasto operativo..." required />
            <Input label="Monto ($) *" value={form.monto} onChange={v=>setForm(p=>({...p,monto:v}))} type="number" required />
            <Select label="Método" value={form.metodo} onChange={v=>setForm(p=>({...p,metodo:v}))}
              options={[{value:"efectivo",label:"Efectivo"},{value:"tarjeta",label:"Tarjeta"},{value:"transferencia",label:"Transferencia"},{value:"otros",label:"Otros"}]} />
          </div>
          <div className="flex gap-2 mt-6">
            <Button variant="secondary" className="flex-1 justify-center" onClick={() => setModal(null)}>Cancelar</Button>
            <Button variant="danger" className="flex-1 justify-center" onClick={registrarEgreso} icon={<TrendingDown size={14} />}>Registrar egreso</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// REPORTES
// ═══════════════════════════════════════════════════════════════════════════

function Reportes({ user }) {
  const perms = PERMISOS[user.rol] || {};
  const [tab, setTab] = useState("financiero");

  const ordenes   = DB.getArr(DB.KEYS.ORDENES).filter(o => !o.deleted_at);
  const repuestos = DB.getArr(DB.KEYS.REPUESTOS).filter(r => !r.deleted_at);
  const kardex    = DB.getArr(DB.KEYS.KARDEX);
  const movsCaja  = DB.getArr(DB.KEYS.MOV_CAJA);
  const pagos     = DB.getArr(DB.KEYS.PAGOS);

  const totalIngresos = movsCaja.filter(m => m.tipo === "ingreso").reduce((s,m) => s+m.monto, 0);
  const totalEgresos  = movsCaja.filter(m => m.tipo === "egreso").reduce((s,m) => s+m.monto, 0);

  // Top repuestos (por movimientos de salida en kardex)
  const topRep = repuestos.map(r => {
    const salidas = kardex.filter(k => k.repuesto_id === r.id && k.tipo === "salida").reduce((s,k) => s+k.cantidad, 0);
    return { ...r, ventas: salidas };
  }).sort((a,b) => b.ventas - a.ventas).slice(0,5);

  const exportCSV = (data, name) => {
    if (!data.length) { alert("Sin datos para exportar."); return; }
    const cols = Object.keys(data[0]);
    const rows = data.map(r => cols.map(k => `"${(r[k]||"").toString().replace(/"/g,'""')}"`).join(","));
    const blob = new Blob([cols.join(",")+"\n"+rows.join("\n")], { type:"text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${name}.csv`; a.click();
  };

  const tabs = [
    { id:"financiero", label:"Financiero",   icon:DollarSign,  show: perms.dashboard_fin },
    { id:"operativo",  label:"Operativo",    icon:Activity,    show: true },
    { id:"auditoria",  label:"Auditoría",    icon:Shield,      show: user.rol === "ADM" || user.rol === "AUD" },
  ].filter(t => t.show);

  return (
    <div className="page-enter">
      <PageHeader title="Reportes" subtitle={`Datos actualizados`}
        actions={<Button variant="secondary" size="sm" onClick={() => exportCSV(ordenes, "ordenes")} icon={<Download size={14} />}>Exportar órdenes CSV</Button>}
      />

      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === t.id ? "bg-white shadow-sm text-indigo-700" : "text-slate-600 hover:text-slate-900"}`}>
            <t.icon size={15} />{t.label}
          </button>
        ))}
      </div>

      {tab === "financiero" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <KpiCard title="Ingresos totales" value={fmt(totalIngresos)} icon={TrendingUp}   color="green" />
            <KpiCard title="Egresos totales"  value={fmt(totalEgresos)}  icon={TrendingDown} color="red" />
            <KpiCard title="Saldo neto"        value={fmt(totalIngresos - totalEgresos)} icon={DollarSign} color="indigo" />
          </div>
          <Card className="p-5">
            <h3 className="font-bold text-slate-800 mb-4">Ingresos por método de pago</h3>
            {["efectivo","transferencia","tarjeta","otros"].map(m => {
              const total = movsCaja.filter(x => x.tipo === "ingreso" && x.metodo === m).reduce((s,x) => s+x.monto, 0);
              const pct   = totalIngresos > 0 ? (total/totalIngresos)*100 : 0;
              return (
                <div key={m} className="flex items-center gap-3 mb-2">
                  <span className="w-28 text-sm text-slate-600 capitalize">{m}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{width:`${pct}%`}} />
                  </div>
                  <span className="text-sm font-bold text-slate-800 w-28 text-right">{fmt(total)}</span>
                  <span className="text-xs text-slate-400 w-10 text-right">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Top repuestos instalados</h3>
              <Button variant="secondary" size="sm" onClick={() => exportCSV(topRep,"top-repuestos")} icon={<Download size={12} />}>CSV</Button>
            </div>
            <DataTable
              columns={[
                { key:"codigo_interno",label:"Código",render:v=><span className="font-mono text-xs text-indigo-700">{v}</span> },
                { key:"tipo",  label:"Tipo" },
                { key:"marca", label:"Marca" },
                { key:"modelo",label:"Modelo" },
                { key:"ventas",label:"Instalaciones",render:v=><Badge className="bg-indigo-100 text-indigo-700">{v}</Badge> },
                { key:"stock", label:"Stock actual",render:v=><span className="font-semibold">{v}</span> },
              ]}
              data={topRep}
            />
          </Card>
        </div>
      )}

      {tab === "operativo" && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <KpiCard title="Total órdenes"  value={ordenes.length}                                                    icon={ClipboardList} color="indigo" />
            <KpiCard title="Entregadas"     value={ordenes.filter(o=>o.estado==="entregado").length}                   icon={CheckCircle}  color="green" />
            <KpiCard title="En proceso"     value={ordenes.filter(o=>!["entregado","anulado"].includes(o.estado)).length} icon={Clock}     color="amber" />
            <KpiCard title="Anuladas"       value={ordenes.filter(o=>o.estado==="anulado").length}                    icon={XCircle}      color="red" />
          </div>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Órdenes por estado</h3>
              <Button variant="secondary" size="sm" onClick={() => exportCSV(ordenes,"ordenes-detalle")} icon={<Download size={12} />}>CSV</Button>
            </div>
            <DataTable
              columns={[
                { key:"numero_orden",label:"Orden",render:v=><span className="font-mono text-xs text-indigo-700">{v}</span> },
                { key:"equipo_marca",label:"Equipo",render:(v,r)=>`${v} ${r.equipo_modelo}` },
                { key:"estado",label:"Estado",render:v=><Badge className={ESTADO_COLORS[v]}>{ESTADO_LABELS[v]}</Badge> },
                { key:"prioridad",label:"Prioridad" },
                { key:"fecha_ingreso",label:"Ingreso",render:v=>fmtDate(v) },
              ]}
              data={ordenes.slice(-20).reverse()}
            />
          </Card>
          <Card className="p-5">
            <h3 className="font-bold text-slate-800 mb-4">Lista de compras sugerida (stock ≤ mínimo)</h3>
            {repuestos.filter(r=>(r.stock-r.stock_reservado)<=2).length === 0
              ? <p className="text-slate-400 text-sm">Todo el stock está por encima del mínimo.</p>
              : repuestos.filter(r=>(r.stock-r.stock_reservado)<=2).map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg mb-2">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{r.tipo} {r.marca} {r.modelo}</p>
                      <p className="text-xs text-slate-500">{r.codigo_interno} · Disponible: {r.stock - r.stock_reservado}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Sugerido comprar</p>
                      <p className="font-bold text-red-700">5 unidades</p>
                    </div>
                  </div>
                ))
            }
          </Card>
        </div>
      )}

      {tab === "auditoria" && (
        <Card>
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Log de auditoría</h3>
            <Button variant="secondary" size="sm" onClick={() => exportCSV(DB.getArr(DB.KEYS.AUDIT),"audit-log")} icon={<Download size={12} />}>CSV</Button>
          </div>
          <DataTable
            columns={[
              { key:"fecha",     label:"Fecha/Hora", render:v=>fmtDate(v) },
              { key:"usuario_id",label:"Usuario",    render:v=>{const u=DB.getArr(DB.KEYS.USUARIOS).find(x=>x.id===v); return u?.nombre ?? `#${v}`;} },
              { key:"accion",    label:"Acción",     render:v=>{
                const c={LOGIN:"bg-blue-100 text-blue-700",CREATE:"bg-emerald-100 text-emerald-700",UPDATE:"bg-amber-100 text-amber-700",DELETE:"bg-red-100 text-red-700",BACKUP:"bg-purple-100 text-purple-700",CONFIG_CHANGE:"bg-slate-100 text-slate-700",LOGIN_FALLIDO:"bg-red-100 text-red-700"};
                return <Badge className={c[v]||"bg-slate-100"}>{v}</Badge>;
              }},
              { key:"entidad",   label:"Entidad" },
            ]}
            data={DB.getArr(DB.KEYS.AUDIT).sort((a,b) => new Date(b.fecha) - new Date(a.fecha)).slice(0,50)}
          />
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN — sección 9 del prompt
// ═══════════════════════════════════════════════════════════════════════════

function Configuracion({ user }) {
  const [tab, setTab]   = useState("taller");
  const [saved, setSaved] = useState(false);

  // Estado local de cada sub-configuración
  const [taller, setTaller] = useState(() => DB.get(DB.KEYS.CONFIG_TALLER) || {});
  const [ui, setUi]         = useState(() => DB.get(DB.KEYS.CONFIG_UI)     || {});
  const [ops, setOps]       = useState(() => DB.get(DB.KEYS.CONFIG)        || {});
  const [usuarios, setUsuarios] = useState([]);
  const [userModal, setUserModal] = useState(null);
  const [userForm, setUserForm]   = useState({ nombre:"", email:"", rol:"TEC", activo:1 });

  const loadUsers = () => setUsuarios(DB.getArr(DB.KEYS.USUARIOS));
  useEffect(loadUsers, []);

  const guardar = () => {
    DB.set(DB.KEYS.CONFIG_TALLER, taller);
    DB.set(DB.KEYS.CONFIG_UI, ui);
    DB.set(DB.KEYS.CONFIG, ops);
    insertAuditLog({ usuarioId:user.id, accion:"CONFIG_CHANGE", entidad:"configuracion", entidadId:null, payload:{ antes:null, despues:{taller,ui,ops}, campos:["taller","ui","ops"] } });
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const exportarDB = () => {
    const data = {};
    Object.entries(DB.KEYS).forEach(([k,v]) => { data[k] = DB.get(v); });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `tallerpro-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
    insertAuditLog({ usuarioId:user.id, accion:"BACKUP", entidad:"sistema", entidadId:null, payload:{ antes:null, despues:{resultado:"OK_EXPORT"}, campos:[] } });
  };

  const restaurarDB = async () => {
    const input = document.createElement("input"); input.type = "file"; input.accept = ".json";
    input.onchange = async e => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        Object.entries(data).forEach(([k, v]) => {
          const key = DB.KEYS[k];
          if (key) DB.set(key, v);
        });
        alert("Backup restaurado. La aplicación se recargará.");
        window.location.reload();
      } catch { alert("Error al leer el archivo de backup. Verifique el formato."); }
    };
    input.click();
  };

  const crearUsuario = async () => {
    if (!userForm.nombre.trim() || !userForm.email.trim()) { alert("Nombre y email son requeridos."); return; }
    const hash = await sha256("Temporal123");
    const arr  = DB.getArr(DB.KEYS.USUARIOS);
    if (arr.find(u => u.email === userForm.email.toLowerCase())) { alert("Ya existe un usuario con ese email."); return; }
    const nuevo = { id: DB.nextId(DB.KEYS.USUARIOS), email: userForm.email.toLowerCase(), password_hash: hash, rol: userForm.rol, nombre: userForm.nombre, activo: 1, intentos_login: 0, bloqueado_hasta: null, deleted_at: null, created_at: todayISO() };
    DB.setArr(DB.KEYS.USUARIOS, [...arr, nuevo]);
    insertAuditLog({ usuarioId:user.id, accion:"CREATE", entidad:"usuarios", entidadId:nuevo.id, payload:{ antes:null, despues:{ nombre:nuevo.nombre, rol:nuevo.rol }, campos:["nombre","email","rol"] } });
    loadUsers(); setUserModal(null);
    alert("Usuario creado. Contraseña temporal: Temporal123");
  };

  const toggleActivo = id => {
    const arr = DB.getArr(DB.KEYS.USUARIOS);
    const admCount = arr.filter(u => u.rol === "ADM" && u.activo && u.id !== id).length;
    const target = arr.find(u => u.id === id);
    if (target?.rol === "ADM" && target?.activo && admCount === 0) { alert("No puedes desactivar el único ADM activo."); return; }
    DB.setArr(DB.KEYS.USUARIOS, arr.map(u => u.id === id ? { ...u, activo: u.activo ? 0 : 1 } : u));
    loadUsers();
  };

  const TABS = [
    { id:"taller",    label:"Datos del Taller",  icon:Building2 },
    { id:"apariencia",label:"Apariencia",         icon:Palette },
    { id:"operacion", label:"Operación",          icon:Settings },
    { id:"seguridad", label:"Seguridad",          icon:Shield },
    { id:"backup",    label:"Backup y Datos",     icon:Database },
    { id:"usuarios",  label:"Usuarios",           icon:Users },
  ];

  return (
    <div className="page-enter">
      <PageHeader title="Configuración" subtitle="Administración del sistema · Solo ADM"
        actions={<>
          {saved && <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold"><CheckCircle size={16} />Guardado</div>}
          <Button onClick={guardar} icon={<Save size={14} />}>Guardar cambios</Button>
        </>}
      />
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-52 flex-shrink-0">
          <Card className="p-2">
            <nav className="space-y-0.5">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition ${tab === t.id ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                  <t.icon size={16} />{t.label}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">

          {tab === "taller" && (
            <Card className="p-6">
              <h3 className="font-bold text-slate-800 mb-5">Datos del Taller</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nombre del taller *" value={taller.nombre_taller} onChange={v=>setTaller(p=>({...p,nombre_taller:v}))} required className="col-span-2" />
                <Input label="NIT / RUT" value={taller.nit_rut} onChange={v=>setTaller(p=>({...p,nit_rut:v}))} />
                <Input label="Propietario" value={taller.propietario} onChange={v=>setTaller(p=>({...p,propietario:v}))} />
                <Input label="Dirección" value={taller.direccion} onChange={v=>setTaller(p=>({...p,direccion:v}))} />
                <Input label="Ciudad" value={taller.ciudad} onChange={v=>setTaller(p=>({...p,ciudad:v}))} />
                <Input label="Teléfono" value={taller.telefono} onChange={v=>setTaller(p=>({...p,telefono:v}))} />
                <Input label="WhatsApp" value={taller.whatsapp} onChange={v=>setTaller(p=>({...p,whatsapp:v}))} />
                <Input label="Email" value={taller.email} onChange={v=>setTaller(p=>({...p,email:v}))} type="email" className="col-span-2" />
                <Input label="Sitio web" value={taller.sitio_web} onChange={v=>setTaller(p=>({...p,sitio_web:v}))} className="col-span-2" />
                <Input label="Slogan" value={taller.slogan} onChange={v=>setTaller(p=>({...p,slogan:v}))} className="col-span-2" />
                <Textarea label="Pie de factura" value={taller.pie_factura} onChange={v=>setTaller(p=>({...p,pie_factura:v}))} className="col-span-2" />
              </div>
            </Card>
          )}

          {tab === "apariencia" && (
            <Card className="p-6">
              <h3 className="font-bold text-slate-800 mb-5">Apariencia e Interfaz</h3>
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">Tema</label>
                  <div className="flex gap-2">
                    {["claro","oscuro","sistema"].map(t => (
                      <button key={t} type="button" onClick={()=>setUi(p=>({...p,tema:t}))}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${ui.tema===t?"border-indigo-600 bg-indigo-50 text-indigo-700":"border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                        {t==="claro"?"☀️ Claro":t==="oscuro"?"🌙 Oscuro":"💻 Sistema"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[["color_primario","Color primario"],["color_secundario","Color secundario"],["color_acento","Color acento"]].map(([k,l]) => (
                    <div key={k}>
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">{l}</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={ui[k]||"#000000"} onChange={e=>setUi(p=>({...p,[k]:e.target.value}))} className="w-10 h-10 rounded cursor-pointer border border-slate-200" />
                        <span className="text-sm font-mono text-slate-600">{ui[k]}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Select label="Formato de fecha" value={ui.formato_fecha} onChange={v=>setUi(p=>({...p,formato_fecha:v}))}
                    options={["DD/MM/YYYY","MM/DD/YYYY","YYYY-MM-DD"].map(v=>({value:v,label:v}))} />
                  <Select label="Moneda" value={ui.moneda_codigo} onChange={v=>setUi(p=>({...p,moneda_codigo:v}))}
                    options={[{value:"COP",label:"COP - Peso colombiano"},{value:"USD",label:"USD - Dólar"},{value:"EUR",label:"EUR - Euro"}]} />
                  <Select label="Separador decimal" value={ui.separador_decimal} onChange={v=>setUi(p=>({...p,separador_decimal:v}))}
                    options={[{value:",",label:"Coma (1.234,56)"},{value:".",label:"Punto (1,234.56)"}]} />
                </div>
              </div>
            </Card>
          )}

          {tab === "operacion" && (
            <Card className="p-6">
              <h3 className="font-bold text-slate-800 mb-5">Parámetros Operativos</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Factor de instalación" value={ops.factor_instalacion} onChange={v=>setOps(p=>({...p,factor_instalacion:parseFloat(v)||1.5}))} type="number" hint="Multiplicador sobre costo del lote" />
                <Input label="Stock mínimo global" value={ops.stock_minimo_global} onChange={v=>setOps(p=>({...p,stock_minimo_global:parseInt(v)||2}))} type="number" />
                <Input label="Plazo recogida (días)" value={ops.plazo_recogida_dias} onChange={v=>setOps(p=>({...p,plazo_recogida_dias:parseInt(v)||30}))} type="number" />
                <Input label="Garantía taller (días)" value={ops.garantia_taller_dias} onChange={v=>setOps(p=>({...p,garantia_taller_dias:parseInt(v)||30}))} type="number" />
                <Input label="Duración reserva (horas)" value={ops.reserva_duracion_horas} onChange={v=>setOps(p=>({...p,reserva_duracion_horas:parseInt(v)||2}))} type="number" />
                <div />
                <Input label="Prefijo código repuesto" value={ops.formato_codigo_repuesto} onChange={v=>setOps(p=>({...p,formato_codigo_repuesto:v}))} hint="Ej: RQ → RQ000001" />
                <Input label="Prefijo número de orden" value={ops.formato_codigo_orden} onChange={v=>setOps(p=>({...p,formato_codigo_orden:v}))} hint="Ej: ORD → ORD-20260430-00001" />
              </div>
              <div className="mt-4 p-3 bg-indigo-50 rounded-lg text-xs text-indigo-700">
                <strong>Vista previa:</strong> Repuesto → <code>{ops.formato_codigo_repuesto}000001</code> · Orden → <code>{ops.formato_codigo_orden}-{new Date().toISOString().slice(0,10).replace(/-/g,"")}-00001</code>
              </div>
            </Card>
          )}

          {tab === "seguridad" && (
            <Card className="p-6">
              <h3 className="font-bold text-slate-800 mb-5">Seguridad</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Intentos máximos de login" value={ops.intentos_maximos_login} onChange={v=>setOps(p=>({...p,intentos_maximos_login:parseInt(v)||5}))} type="number" hint="1–10 intentos" />
                <Input label="Tiempo de bloqueo (minutos)" value={ops.tiempo_bloqueo_minutos} onChange={v=>setOps(p=>({...p,tiempo_bloqueo_minutos:parseInt(v)||15}))} type="number" hint="1–1440 minutos" />
              </div>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">Las contraseñas se almacenan como hash SHA-256. La sesión solo existe en memoria del navegador (sessionStorage simulado con módulo en-memoria).</p>
              </div>
            </Card>
          )}

          {tab === "backup" && (
            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="font-bold text-slate-800 mb-4">Exportar / Importar datos</h3>
                <p className="text-sm text-slate-500 mb-4">Todos los datos se almacenan en el navegador (localStorage). Exporta un backup JSON para salvaguardarlos.</p>
                <div className="flex gap-3">
                  <Button onClick={exportarDB} icon={<Download size={14} />}>Exportar backup JSON</Button>
                  <Button variant="secondary" onClick={restaurarDB} icon={<Upload size={14} />}>Restaurar desde backup</Button>
                </div>
              </Card>
              <Card className="p-6 border-red-200">
                <div className="flex items-center gap-2 mb-4"><AlertTriangle size={16} className="text-red-600" /><h3 className="font-bold text-red-800">Zona de peligro</h3></div>
                <Button variant="danger" onClick={() => { if(confirm("¿BORRAR TODOS LOS DATOS? Esta acción no se puede deshacer.")) { Object.values(DB.KEYS).forEach(k => localStorage.removeItem(k)); window.location.reload(); } }}>
                  Borrar todos los datos y reiniciar
                </Button>
              </Card>
            </div>
          )}

          {tab === "usuarios" && (
            <div>
              <div className="flex justify-end mb-4">
                <Button onClick={() => { setUserForm({nombre:"",email:"",rol:"TEC",activo:1}); setUserModal("nuevo"); }} icon={<Plus size={14} />}>Crear usuario</Button>
              </div>
              <Card>
                <DataTable
                  columns={[
                    { key:"nombre", label:"Nombre" },
                    { key:"email",  label:"Email" },
                    { key:"rol",    label:"Rol",    render:v=><Badge className={ROLE_COLORS[v]}>{ROLE_LABELS[v]}</Badge> },
                    { key:"activo", label:"Estado", render:v=>v?<Badge className="bg-emerald-100 text-emerald-700">Activo</Badge>:<Badge className="bg-slate-100 text-slate-500">Inactivo</Badge> },
                    { key:"created_at",label:"Alta",render:v=>fmtDate(v) },
                    { key:"acciones",  label:"", render:(_,row)=>(
                      <div className="flex gap-1">
                        <button onClick={()=>toggleActivo(row.id)} className={`p-1.5 rounded hover:bg-slate-100 ${row.activo?"text-emerald-600":"text-slate-400"}`} title={row.activo?"Desactivar":"Activar"}>
                          {row.activo ? <Unlock size={14} /> : <Lock size={14} />}
                        </button>
                      </div>
                    )},
                  ]}
                  data={usuarios}
                />
              </Card>
              {userModal && (
                <Modal title="Crear usuario" onClose={() => setUserModal(null)} size="sm">
                  <div className="space-y-4">
                    <Input label="Nombre completo *" value={userForm.nombre} onChange={v=>setUserForm(p=>({...p,nombre:v}))} required />
                    <Input label="Email *" value={userForm.email} onChange={v=>setUserForm(p=>({...p,email:v}))} type="email" required />
                    <Select label="Rol" value={userForm.rol} onChange={v=>setUserForm(p=>({...p,rol:v}))}
                      options={Object.entries(ROLE_LABELS).map(([v,l])=>({value:v,label:l}))} />
                    <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                      Contraseña temporal: <strong>Temporal123</strong> · El usuario deberá cambiarla en su próximo acceso.
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <Button variant="secondary" className="flex-1 justify-center" onClick={() => setUserModal(null)}>Cancelar</Button>
                    <Button className="flex-1 justify-center" onClick={crearUsuario} icon={<Save size={14} />}>Crear</Button>
                  </div>
                </Modal>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SIDEBAR + LAYOUT PRINCIPAL — sección 11 del prompt
// ═══════════════════════════════════════════════════════════════════════════

const NAV_ITEMS = [
  { id:"dashboard",  label:"Dashboard",     icon:LayoutDashboard, perms:["ADM","CON","TEC","REC","AUD"] },
  { id:"clientes",   label:"Clientes",      icon:Users,           perms:["ADM","CON","TEC","REC","AUD"] },
  { id:"ordenes",    label:"Órdenes",       icon:ClipboardList,   perms:["ADM","CON","TEC","REC","AUD"] },
  { id:"inventario", label:"Inventario",    icon:Package,         perms:["ADM","CON","TEC","REC","AUD"] },
  { id:"caja",       label:"Caja",          icon:DollarSign,      perms:["ADM","CON"] },
  { id:"reportes",   label:"Reportes",      icon:BarChart3,       perms:["ADM","CON","TEC","REC","AUD"] },
  { id:"config",     label:"Configuración", icon:Settings,        perms:["ADM"] },
];

function AppLayout({ user, onLogout }) {
  const [page, setPage]               = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifCount, setNotifCount]   = useState(0);

  useEffect(() => {
    // Calcular alertas: stock bajo + equipos listos sin recoger
    const r = DB.getArr(DB.KEYS.REPUESTOS).filter(x => !x.deleted_at && (x.stock - x.stock_reservado) <= 2).length;
    const l = DB.getArr(DB.KEYS.ORDENES).filter(o => o.estado === "listo").length;
    setNotifCount(r + l);
    // Job: liberar reservas vencidas (sección 6.5)
    liberarReservasVencidas();
    const job = setInterval(liberarReservasVencidas, 5 * 60 * 1000);
    return () => clearInterval(job);
  }, []);

  const items = NAV_ITEMS.filter(n => n.perms.includes(user.rol));
  const caja  = DB.get(DB.KEYS.CAJA);
  const taller = DB.get(DB.KEYS.CONFIG_TALLER);

  const PAGES = {
    dashboard:  <Dashboard  user={user} />,
    clientes:   <Clientes   user={user} />,
    ordenes:    <Ordenes    user={user} />,
    inventario: <Inventario user={user} />,
    caja:       <Caja       user={user} />,
    reportes:   <Reportes   user={user} />,
    config:     <Configuracion user={user} />,
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden" style={{ fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      {/* ─── Sidebar ─── */}
      <aside className="flex-shrink-0 bg-slate-900 flex flex-col transition-all duration-200" style={{ width: sidebarOpen ? 232 : 64 }}>
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-slate-700/50">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench size={16} className="text-white" />
          </div>
          {sidebarOpen && <div className="ml-3 min-w-0">
            <p className="font-black text-white text-sm leading-tight truncate">{taller?.nombre_taller || "TallerPro"}</p>
            <p className="text-indigo-400 text-xs">v5.0</p>
          </div>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          {items.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition text-left ${page === item.id ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
              <item.icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-slate-700/50">
          <div className={`flex items-center gap-3 ${sidebarOpen ? "" : "justify-center"}`}>
            <div className="w-8 h-8 bg-indigo-700 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
              {user.nombre[0]}
            </div>
            {sidebarOpen && <>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{user.nombre}</p>
                <Badge className={`mt-0.5 ${ROLE_COLORS[user.rol]}`}>{ROLE_LABELS[user.rol]}</Badge>
              </div>
              <button onClick={onLogout} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white flex-shrink-0" title="Cerrar sesión">
                <LogOut size={15} />
              </button>
            </>}
          </div>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <Menu size={18} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {/* Estado caja */}
            <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${caja?.abierta ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {caja?.abierta ? "🟢 Caja abierta" : "🔴 Caja cerrada"}
            </div>
            {/* Notificaciones */}
            {notifCount > 0 && (
              <button onClick={() => setPage("reportes")} className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                <Bell size={16} />
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">{notifCount}</span>
              </button>
            )}
            <button onClick={onLogout} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 text-sm font-medium">
              <LogOut size={15} /><span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        {/* Contenido de página */}
        <main className="flex-1 overflow-y-auto p-6">
          {PAGES[page] || <Dashboard user={user} />}
        </main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RAÍZ DE LA APLICACIÓN
// ═══════════════════════════════════════════════════════════════════════════

export default function App() {
  const [user, setUser] = useState(() => getCurrentUser());
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initDB();
    setInitialized(true);
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wrench size={32} className="text-white animate-spin" />
          </div>
          <p className="text-white font-bold">Iniciando TallerPro...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={u => setUser(u)} />;
  }

  return (
    <AppLayout
      user={user}
      onLogout={() => { logout(); setUser(null); }}
    />
  );
}

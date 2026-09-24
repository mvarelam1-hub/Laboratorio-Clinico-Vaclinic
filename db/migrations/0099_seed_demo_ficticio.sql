-- ============================================================
-- VACLINIC - Seed de datos FICTICIOS para pruebas de la Etapa 2
-- Ningún nombre, DNI o teléfono corresponde a una persona real.
-- No debe ejecutarse en un ambiente productivo real.
-- ============================================================

BEGIN;

INSERT INTO usuario (nombre_completo, correo, contrasena_hash, rol, especialidad, numero_colegiado, estado)
VALUES
    ('Bioanalista Demo Uno', 'bioanalista.demo@vaclinic.test', 'hash_demo_1', 'bioanalista', 'Química Clínica', 'COL-0001', TRUE),
    ('Directora Demo Dos', 'directora.demo@vaclinic.test', 'hash_demo_2', 'director_laboratorio', 'Patología Clínica', 'COL-0002', TRUE)
ON CONFLICT (correo) DO NOTHING;

INSERT INTO paciente (nombre_completo, dni, fecha_nacimiento, genero, telefono_whatsapp, es_menor_edad, nombre_encargado_legal, telefono_encargado_legal)
VALUES
    ('Paciente Ficticio Adulto', 'DEMO-0001', '1990-05-10', 'F', '00000001', FALSE, NULL, NULL),
    ('Paciente Ficticio Menor', 'DEMO-0002', '2015-03-20', 'M', '00000002', TRUE, 'Tutor Ficticio Demo', '00000003')
RETURNING id_paciente, nombre_completo;

INSERT INTO examen (codigo_examen, nombre_examen, categoria, tipo_muestra, precio, unidad_medida)
VALUES ('GLU-001', 'Glucosa en ayunas', 'bioquimica', 'Suero sanguíneo', 45.00, 'mg/dL')
ON CONFLICT (codigo_examen) DO NOTHING;

INSERT INTO rango_referencia (id_examen, genero, edad_minima, edad_maxima, valor_minimo, valor_maximo, texto_referencia)
SELECT id_examen, 'Ambos', 0, 120, 70, 99, 'Normal: 70-99 mg/dL'
FROM examen WHERE codigo_examen = 'GLU-001';

INSERT INTO orden (numero_orden, id_paciente, estado)
SELECT 'DEMO-ORD-0001', id_paciente, 'En proceso'
FROM paciente WHERE dni = 'DEMO-0001'
RETURNING id_orden, numero_orden;

INSERT INTO detalle_orden (id_orden, id_examen, precio_unitario)
SELECT o.id_orden, e.id_examen, e.precio
FROM orden o, examen e
WHERE o.numero_orden = 'DEMO-ORD-0001' AND e.codigo_examen = 'GLU-001'
RETURNING id_detalle;

-- Resultado con valor FUERA de rango (150 mg/dL > 99) para probar el trigger
INSERT INTO resultado (id_detalle, id_analista, valor_capturado, estado)
SELECT do_.id_detalle, u.id_usuario, '150', 'Borrador'
FROM detalle_orden do_
JOIN orden o ON o.id_orden = do_.id_orden
CROSS JOIN (SELECT id_usuario FROM usuario WHERE correo = 'bioanalista.demo@vaclinic.test') u
WHERE o.numero_orden = 'DEMO-ORD-0001'
RETURNING id_resultado, valor_capturado, esta_fuera_de_rango;

COMMIT;

-- ============================================================
-- VACLINIC - Seed de datos FICTICIOS para pruebas de la Etapa 2
-- Ningún nombre, DNI o teléfono corresponde a una persona real.
-- No debe ejecutarse en un ambiente productivo real.
-- ============================================================

BEGIN;

-- Contraseña de ambas cuentas demo: "Demo12345!" (NUNCA usar en producción).
-- Los hashes de abajo son scrypt real ("salt:hash" en hex, ver
-- server/password.ts), generados una sola vez con un script de un solo uso
-- que llamó a hashPassword('Demo12345!') — este archivo SQL no ejecuta
-- código de la aplicación, solo contiene el resultado ya calculado.
-- Antes (Etapa 2): estas filas traían 'hash_demo_1'/'hash_demo_2', cadenas
-- de relleno sin uso real porque la autenticación de personal era Firebase
-- Authentication, no esta columna.
INSERT INTO usuario (nombre_completo, correo, contrasena_hash, rol, especialidad, numero_colegiado, estado, must_change_password)
VALUES
    ('Bioanalista Demo Uno', 'bioanalista.demo@vaclinic.test', 'deea1cbbb0507a911654dd3905b5530c:6b9607029b3ac0cbaf70293182a09a80ae38f35e83970460044ae5407527fc6cba43267fb704f4686c568245bd4fb505ded03e34ac5eb5ca3e45b2577e5e7c68', 'bioanalista', 'Química Clínica', 'COL-0001', TRUE, FALSE),
    ('Directora Demo Dos', 'directora.demo@vaclinic.test', 'ebe65b6f54ff70583a7f79dae69d0246:f86d164b265f93b744bc85e9c0557889197cfa4083057392925b8d6848db34de9c7b7f8f01455ab6df85ec564fe7a39a629ef6f69e8162c4f98c80ac700fc612', 'director_laboratorio', 'Patología Clínica', 'COL-0002', TRUE, FALSE)
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

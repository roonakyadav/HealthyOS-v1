export type Role = 'doctor' | 'admin' | 'patient';

export type User = {
    id: string;
    email: string;
    role: Role;
    created_at: string;
    updated_at: string;
};

export type Patient = {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    phone: string;
    email?: string;
    address: string;
    emergency_contact: string;
    medical_history?: string;
    created_at: string;
    updated_at: string;
};

export type Doctor = {
    id: string;
    first_name: string;
    last_name: string;
    specialization: string;
    license_number: string;
    phone: string;
    email: string;
    address: string;
    created_at: string;
    updated_at: string;
};

export type Visit = {
    id: string;
    patient_id: string;
    doctor_id: string;
    date: string;
    status: 'waiting' | 'in_progress' | 'completed';
    symptoms?: string;
    diagnosis?: string;
    prescription?: string;
    notes?: string;
    vitals?: {
        bp?: string;
        heart_rate?: number;
        temperature?: number;
        weight?: number;
        spo2?: number;
    };
    created_at: string;
    // Relations
    patient?: Patient;
    doctor?: Doctor;
};

export type Medication = {
    id: string;
    visit_id: string;
    medicine_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes?: string;
    created_at: string;
};

export type Attachment = {
    id: string;
    visit_id: string;
    filename: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    uploaded_by: string;
    created_at: string;
};

export type Appointment = {
    id: string;
    patient_id: string;
    doctor_id: string;
    date: string;
    time: string;
    status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
    purpose: string;
    notes?: string;
    created_at: string;
    // Relations (added in queries)
    patient?: {
        id: string;
        first_name: string;
        last_name: string;
    };
    doctor?: {
        id: string;
        first_name: string;
        last_name: string;
        specialization: string;
    };
};

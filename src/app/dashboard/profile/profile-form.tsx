"use client";

import { useActionState } from "react";
import { updateProfile } from "./actions";

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 13,
  border: "1.5px solid #E9E3D8",
  background: "#fff",
  padding: "11px 14px",
  fontSize: 14,
  color: "#1C1A17",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#8B857A",
  marginBottom: 4,
  display: "block",
};

type Props = {
  fullName: string;
  gender: "m" | "f" | null;
  address: string;
  birthDate: string;
  schoolBackground: string;
};

export function ProfileForm({ fullName, gender, address, birthDate, schoolBackground }: Props) {
  const [state, formAction, pending] = useActionState(updateProfile, {});

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl p-4"
      style={{ background: "#fff", boxShadow: "0 6px 16px rgba(28,26,23,.04)" }}
    >
      <div>
        <label style={labelStyle}>Prénom et nom</label>
        <input name="full_name" type="text" defaultValue={fullName} required style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Genre</label>
        <select name="gender" defaultValue={gender ?? ""} required style={inputStyle}>
          <option value="" disabled>Genre…</option>
          <option value="m">Homme</option>
          <option value="f">Femme</option>
        </select>
      </div>

      <div>
        <label style={labelStyle}>Adresse</label>
        <input name="address" type="text" defaultValue={address} placeholder="Adresse postale" style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Date de naissance</label>
        <input name="birth_date" type="date" defaultValue={birthDate} style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Parcours scolaire</label>
        <textarea
          name="school_background"
          defaultValue={schoolBackground}
          placeholder="Niveau d'arabe, expérience d'apprentissage précédente…"
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      {state.error && <p style={{ color: "#B4292E", fontSize: 13 }}>{state.error}</p>}
      {state.success && (
        <p style={{ color: "#0A6B4E", fontSize: 13 }}>Profil mis à jour.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[12px] py-2.5 font-bold text-white text-sm disabled:opacity-50"
        style={{ background: "#0F9D6E" }}
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}

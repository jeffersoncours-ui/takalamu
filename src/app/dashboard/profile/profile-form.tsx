"use client";

import { useActionState } from "react";
import { updateProfile } from "./actions";
import { fieldStyles } from "@/components/ui/field";

const inputStyle = fieldStyles("parchment").input;

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--tk-muted-olive)",
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
      style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)", boxShadow: "var(--tk-shadow-card)" }}
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

      {state.error && <p style={{ color: "var(--tk-danger)", fontSize: 13 }}>{state.error}</p>}
      {state.success && (
        <p style={{ color: "var(--tk-green-active)", fontSize: 13 }}>Profil mis à jour.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[12px] py-2.5 font-bold text-sm disabled:opacity-60"
        style={{ background: "linear-gradient(180deg, var(--tk-gold-light), var(--tk-gold))", color: "var(--tk-ink-hero-to)" }}
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}

"use client";

export function DeleteSessionButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !window.confirm(
            "Supprimer définitivement ce cours ? Le vocabulaire et la grammaire liés seront supprimés. Cette action est irréversible."
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-[12px] px-4 py-2.5 font-semibold text-sm transition-opacity hover:opacity-85"
        style={{ background: "#FDECEC", color: "#B4292E", border: "1px solid #F3B0B2" }}
      >
        Supprimer
      </button>
    </form>
  );
}

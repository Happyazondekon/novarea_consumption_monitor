"use client";

import { Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

export function DeleteSubmissionBtn({ id, entiteName }: { id: string, entiteName: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Supprimer ce rapport ?',
      text: `Vous allez supprimer définitivement la soumission de : ${entiteName}. Cette action est irréversible.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e8112d',
      cancelButtonColor: '#71717a',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/soumissions/${id}`, { method: 'DELETE' });
        if (res.ok) {
          Swal.fire({
            title: 'Supprimé !',
            text: 'Le rapport a été retiré du système.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
          router.refresh();
        } else {
            throw new Error();
        }
      } catch (error) {
        Swal.fire('Erreur', 'Impossible de supprimer ce rapport.', 'error');
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="p-2 rounded-lg border border-zinc-100 dark:border-zinc-800 text-zinc-300 hover:text-red-500 hover:border-red-500/30 transition-all ml-2"
      title="Supprimer la soumission"
    >
      <Trash2 size={14} />
    </button>
  );
}

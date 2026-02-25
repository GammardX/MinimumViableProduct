import type { Note } from '../types/types';

interface UseNavigationReturn {
	handleNavigate: (target: string, anchor?: string) => void;
	handleCopyInternalLink: () => void;
}

export function useNavigation(
	notes: Note[],
	activeNote: Note | undefined,
	setActiveNoteId: (id: string) => void,
	setSnackbar: React.Dispatch<
		React.SetStateAction<{
			open: boolean;
			message: string;
			severity: 'success' | 'error';
		}>
	>
): UseNavigationReturn {
	const handleNavigate = (target: string, anchor?: string) => {
		const decodedTarget = decodeURIComponent(target);

		let noteToOpen = notes.find((n) => n.id === decodedTarget);
		if (!noteToOpen) {
			noteToOpen = notes.find(
				(n) => n.title.toLowerCase() === decodedTarget.toLowerCase()
			);
		}

		if (noteToOpen) {
			setActiveNoteId(noteToOpen.id);
			if (anchor) {
				setTimeout(() => {
					const elementId = anchor.toLowerCase().replace(/\s+/g, '');
					const element = document.getElementById(elementId);
					if (element) element.scrollIntoView({ behavior: 'smooth' });
				}, 200);
			}
		} else {
			setSnackbar({
				open: true,
				message: `Nota "${decodedTarget}" non trovata!`,
				severity: 'error'
			});
		}
	};

	const handleCopyInternalLink = () => {
		if (!activeNote) return;
		const linkStr = `[Vai a ${activeNote.title}](#note:${activeNote.id})`;
		navigator.clipboard
			.writeText(linkStr)
			.then(() =>
				setSnackbar({
					open: true,
					message: "Ancoraggio copiato: ora incollalo in un'altra nota!",
					severity: 'success'
				})
			)
			.catch((err) => console.error('Errore nella copia del link:', err));
	};

	return { handleNavigate, handleCopyInternalLink };
}

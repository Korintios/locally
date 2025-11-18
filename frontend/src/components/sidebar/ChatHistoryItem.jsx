import { useState } from "react";
import {
	Button,
	Popover,
	PopoverTrigger,
	PopoverContent,
	Input,
} from "@heroui/react";
import { MoreVerticalIcon, EditIcon, TrashIcon } from "../icons";

/**
 * Componente para mostrar un item individual de conversación en el historial.
 *
 * @param {Object} props
 * @param {Object} props.conversation - Datos de la conversación
 * @param {boolean} props.isActive - Si la conversación está actualmente seleccionada
 * @param {Function} props.onClick - Callback al hacer click en la conversación
 * @param {Function} props.onRename - Callback para renombrar la conversación
 * @param {Function} props.onDelete - Callback para eliminar la conversación
 */
export default function ChatHistoryItem({
	conversation,
	isActive,
	onClick,
	onRename,
	onDelete,
}) {
	const [isEditing, setIsEditing] = useState(false);
	const [newTitle, setNewTitle] = useState(conversation.title);
	const [showOptions, setShowOptions] = useState(false);

	/**
	 * Formatea una fecha ISO a formato relativo ("Hace 2 horas", "Ayer", etc.)
	 */
	const formatDate = (isoDate) => {
		const date = new Date(isoDate);
		const now = new Date();
		const diffMs = now - date;
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return "Ahora";
		if (diffMins < 60) return `Hace ${diffMins} min`;
		if (diffHours < 24) return `Hace ${diffHours}h`;
		if (diffDays === 1) return "Ayer";
		if (diffDays < 7) return `Hace ${diffDays} días`;

		// Si es más antiguo, mostrar fecha
		return date.toLocaleDateString("es-ES", {
			day: "numeric",
			month: "short",
		});
	};

	/**
	 * Maneja el proceso de renombrado de la conversación.
	 */
	const handleRename = () => {
		if (newTitle.trim() && newTitle !== conversation.title) {
			onRename(conversation._id, newTitle);
		}
		setIsEditing(false);
	};

	/**
	 * Maneja la tecla Enter para confirmar el renombrado.
	 */
	const handleKeyPress = (e) => {
		if (e.key === "Enter") {
			handleRename();
		} else if (e.key === "Escape") {
			setNewTitle(conversation.title);
			setIsEditing(false);
		}
	};

	return (
		<div
			className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
				isActive
					? "bg-blue-50 border border-blue-200"
					: "hover:bg-gray-100 border border-transparent"
			}`}
			onClick={!isEditing ? onClick : undefined}
		>
			{/* Contenido principal */}
			<div className="flex-1 min-w-0">
				{isEditing ? (
					// Modo edición
					<Input
						size="sm"
						value={newTitle}
						onChange={(e) => setNewTitle(e.target.value)}
						onKeyDown={handleKeyPress}
						onBlur={handleRename}
						autoFocus
						className="font-afacad"
					/>
				) : (
					// Modo normal
					<>
						<p className="text-sm font-medium text-gray-800 truncate font-afacad">
							{conversation.title}
						</p>
						<p className="text-xs text-gray-500 font-afacad">
							{formatDate(conversation.updated_at)}
						</p>
					</>
				)}
			</div>

			{/* Botón de opciones (solo visible en hover o cuando está activo) */}
			{!isEditing && (
				<div
					className={`shrink-0 ${
						isActive || showOptions
							? "opacity-100"
							: "opacity-0 group-hover:opacity-100"
					} transition-opacity`}
					onClick={(e) => e.stopPropagation()}
				>
					<Popover
						placement="right-start"
						isOpen={showOptions}
						onOpenChange={setShowOptions}
					>
						<PopoverTrigger>
							<Button
								isIconOnly
								variant="light"
								size="sm"
								className="min-w-6 w-6 h-6 text-gray-500 hover:text-gray-700"
								aria-label="Opciones"
							>
								<MoreVerticalIcon className="w-4 h-4" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className=" p-1">
							<div className="flex flex-col gap-1">
								{/* Renombrar */}
								<Button
									variant="light"
									size="sm"
									className="justify-start h-auto py-2 px-2 font-afacad text-gray-700"
									startContent={<EditIcon className="w-4 h-4" />}
									onClick={() => {
										setIsEditing(true);
										setShowOptions(false);
									}}
								>
									Renombrar
								</Button>

								{/* Eliminar */}
								<Button
									variant="light"
									size="sm"
									className="justify-start h-auto py-2 px-2 font-afacad text-red-600 hover:text-red-700"
									startContent={<TrashIcon className="w-4 h-4" />}
									onClick={() => {
										if (
											window.confirm(
												"¿Estás seguro de que deseas eliminar esta conversación?"
											)
										) {
											onDelete(conversation._id);
										}
										setShowOptions(false);
									}}
								>
									Eliminar
								</Button>
							</div>
						</PopoverContent>
					</Popover>
				</div>
			)}
		</div>
	);
}

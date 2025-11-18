import { useState, useEffect } from "react";
import { Button, Input } from "@heroui/react";
import {
	PlusIcon,
	SearchIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from "../icons";
import ChatHistoryItem from "./ChatHistoryItem";

/**
 * Componente Sidebar para mostrar y gestionar el historial de conversaciones.
 *
 * @param {Object} props
 * @param {Array} props.conversations - Lista de conversaciones
 * @param {string|null} props.currentConversationId - ID de la conversación actualmente seleccionada
 * @param {Function} props.onSelectConversation - Callback al seleccionar una conversación
 * @param {Function} props.onNewConversation - Callback para crear una nueva conversación
 * @param {Function} props.onRenameConversation - Callback para renombrar una conversación
 * @param {Function} props.onDeleteConversation - Callback para eliminar una conversación
 * @param {boolean} props.isCollapsed - Estado de colapso del sidebar
 * @param {Function} props.onToggleCollapse - Callback para colapsar/expandir el sidebar
 */
export default function Sidebar({
	conversations,
	currentConversationId,
	onSelectConversation,
	onNewConversation,
	onRenameConversation,
	onDeleteConversation,
	isCollapsed = false,
	onToggleCollapse,
}) {
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredConversations, setFilteredConversations] =
		useState(conversations);

	/**
	 * Filtra las conversaciones basándose en el término de búsqueda.
	 */
	useEffect(() => {
		if (searchTerm.trim() === "") {
			setFilteredConversations(conversations);
		} else {
			const filtered = conversations.filter((conv) =>
				conv.title.toLowerCase().includes(searchTerm.toLowerCase())
			);
			setFilteredConversations(filtered);
		}
	}, [searchTerm, conversations]);

	// Si está colapsado, mostrar solo el botón de toggle
	if (isCollapsed) {
		return (
			<div className="h-full bg-white border-r border-gray-200 flex flex-col items-center p-2">
				<Button
					isIconOnly
					variant="light"
					size="sm"
					onClick={onToggleCollapse}
					className="text-gray-600"
					aria-label="Expandir sidebar"
				>
					<ChevronRightIcon className="w-5 h-5" />
				</Button>
			</div>
		);
	}

	return (
		<div className="h-full bg-white border-r border-gray-200 flex flex-col w-64">
			{/* Header */}
			<div className="p-4 border-b border-gray-200 space-y-3">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold text-gray-800 font-afacad">
						Conversaciones
					</h2>
					<Button
						isIconOnly
						variant="light"
						size="sm"
						onClick={onToggleCollapse}
						className="text-gray-600"
						aria-label="Colapsar sidebar"
					>
						<ChevronLeftIcon className="w-5 h-5" />
					</Button>
				</div>

				{/* Botón Nueva Conversación */}
				<Button
					onClick={onNewConversation}
					className="w-full bg-blue-500 text-white font-afacad"
					startContent={<PlusIcon className="w-5 h-5" />}
					size="md"
				>
					Nueva Conversación
				</Button>

				{/* Barra de Búsqueda */}
				<Input
					placeholder="Buscar conversaciones..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					startContent={<SearchIcon className="w-4 h-4 text-gray-400" />}
					size="sm"
					className="font-afacad"
					classNames={{
						input: "font-afacad",
					}}
				/>
			</div>

			{/* Body - Lista de Conversaciones */}
			<div className="flex-1 overflow-y-auto p-2 space-y-1">
				{filteredConversations.length === 0 ? (
					<div className="text-center text-gray-500 py-8 font-afacad">
						{searchTerm
							? "No se encontraron conversaciones"
							: "No hay conversaciones aún"}
					</div>
				) : (
					filteredConversations.map((conversation) => (
						<ChatHistoryItem
							key={conversation._id}
							conversation={conversation}
							isActive={conversation._id === currentConversationId}
							onClick={() => onSelectConversation(conversation._id)}
							onRename={onRenameConversation}
							onDelete={onDeleteConversation}
						/>
					))
				)}
			</div>

			{/* Footer - Información adicional o links */}
			<div className="p-4 border-t border-gray-200">
				<a
					href="https://github.com/Korintios/locally"
					target="_blank"
					rel="noopener noreferrer"
					className="text-sm text-gray-600 hover:text-blue-500 transition-colors font-afacad flex items-center justify-center gap-2"
				>
					<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
					</svg>
					GitHub
				</a>
			</div>
		</div>
	);
}

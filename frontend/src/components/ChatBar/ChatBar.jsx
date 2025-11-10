import { useState } from "react";
import {
	Button,
	Popover,
	PopoverTrigger,
	PopoverContent,
} from "@heroui/react";
import {
	SendIcon,
	SettingsIcon,
	TrelloIcon,
	GithubIcon,
	FigmaIcon,
} from "../Icons";
import MCPToggle from "./MCPToogle";

export default function ChatBar({ value, onChange, onSubmit, isLoading }) {
	const [showMCPMenu, setShowMCPMenu] = useState(false);
	const [mcpToggles, setMcpToggles] = useState({
		trello: false,
		github: false,
		figma: false,
	});

	const toggleMCP = (name) => {
		setMcpToggles((prev) => ({
			...prev,
			[name]: !prev[name],
		}));
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			onSubmit();
		}
	};

	return (
		<div className="relative w-full">
			{/* Barra de Chat Principal */}
			<div className="bg-white rounded-[60px] shadow-md flex items-center px-2 py-2 w-full">
				{/* Botones Izquierdos */}
				<div className="flex items-center shrink-0">
					<Popover
						placement="top-start"
						isOpen={showMCPMenu}
						onOpenChange={setShowMCPMenu}
						classNames={{
							content: "rounded-lg shadow-lg",
						}}
					>
						<PopoverTrigger>
							<Button
								isIconOnly
								variant="flat"
								radius="full"
								size="md"
								className="text-[#94a3b8]"
								aria-label="Configurar MCPs"
							>
								<SettingsIcon />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="mb-4">
							<div className="w-[179px] flex flex-col gap-1 py-2">
								{/* Configuración */}
								<Button
									variant="light"
									size="sm"
									className="justify-start h-auto py-1 px-1.5 min-h-0 text-[#94a3b8]"
									startContent={
										<SettingsIcon className="w-2.5 h-2.5" />
									}
								>
									<span className="text-md text-slate-400 font-['Afacad',sans-serif]">
										Configuración
									</span>
								</Button>

								{/* Divider */}
								<div className="h-px bg-slate-200 my-1" />

								{/* Título MCPs */}
								<div className="px-1.5 py-1">
									<span className="text-md text-slate-400 font-['Afacad',sans-serif]">
										MCPs
									</span>
								</div>

								{/* MCP Toggles */}
								<MCPToggle
									icon={<TrelloIcon />}
									name="Trello"
									isActive={mcpToggles.trello}
									onToggle={() => toggleMCP("trello")}
								/>
								<MCPToggle
									icon={<GithubIcon />}
									name="GitHub"
									isActive={mcpToggles.github}
									onToggle={() => toggleMCP("github")}
								/>
								<MCPToggle
									icon={<FigmaIcon />}
									name="Figma"
									isActive={mcpToggles.figma}
									onToggle={() => toggleMCP("figma")}
								/>
							</div>
						</PopoverContent>
					</Popover>
				</div>

				{/* Input de Texto nativo */}
				<input
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={handleKeyPress}
					placeholder="Que tienes en mente?..."
					disabled={isLoading}
					className="flex-1 bg-transparent leading-none outline-none text-base/tight font-afacad px-2"
				/>

				{/* Botón de Enviar usando HeroUI Button */}
				<Button
					isIconOnly
					color="primary"
					radius="full"
					size="lg"
					onPress={onSubmit}
					isDisabled={isLoading || !value.trim()}
					className="w-10 h-10 min-w-10"
					aria-label="Enviar mensaje"
				>
					<SendIcon className="w-5 h-5 text-white" />
				</Button>
			</div>
		</div>
	);
}

import { Switch } from "@heroui/react";

function MCPToggle({ icon, name, isActive, onToggle }) {
	return (
		<div
			onClick={onToggle}
			className="flex items-center justify-between gap-2 px-1.5 py-1 rounded-lg hover:bg-gray-50 transition-colors w-full cursor-pointer"
		>
			<div className="flex items-center gap-2">
				<div className="size-5 shrink-0 text-slate-400">{icon}</div>
				<span className="text-xs text-slate-400 font-['Afacad',sans-serif] select-none">
					{name}
				</span>
			</div>
			<Switch size="sm" isSelected={isActive} onValueChange={onToggle} />
		</div>
	);
}

export default MCPToggle;

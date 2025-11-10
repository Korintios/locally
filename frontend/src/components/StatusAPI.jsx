import { Chip } from "@heroui/react";
import { useEffect, useState } from "react";

export default function StatusAPI() {
	const [isAPIUp, setIsAPIUp] = useState(false);
	const [isChecking, setIsChecking] = useState(true);

	async function checkStatusAPI() {
		try {
			setIsChecking(true);
			const response = await fetch("http://localhost:8000", {
				signal: AbortSignal.timeout(5000), // Timeout de 5s
			});
			setIsAPIUp(response.ok); // response.ok verifica status 200-299
		} catch (error) {
			console.error("Error checking API status:", error);
			setIsAPIUp(false);
		} finally {
			setIsChecking(false);
		}
	}

	function StatusAPIChip() {
		if (isChecking) {
			return <Chip color="warning">Checking API...</Chip>;
		}

		return (
			<Chip className="test" color={isAPIUp ? "primary" : "danger"}>
				{isAPIUp ? "API is Online" : "API is Offline"}
			</Chip>
		);
	}

	useEffect(() => {
		checkStatusAPI();

		// Opcional: verificar periódicamente cada 1 minuto
		const interval = setInterval(checkStatusAPI, 300000);

		return () => clearInterval(interval); // Cleanup
	}, []);

	return <StatusAPIChip />;
}

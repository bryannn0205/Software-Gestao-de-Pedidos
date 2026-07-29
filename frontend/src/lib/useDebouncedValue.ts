import { useEffect, useState } from "react";

// Atrasa a propagação de um valor que muda rápido (ex.: campo de busca digitado
// tecla a tecla) para evitar disparar uma requisição por tecla — só refaz a
// busca depois que o usuário parou de digitar por `delayMs`.
export function useDebouncedValue<T>(valor: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(valor);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(valor), delayMs);
    return () => clearTimeout(timer);
  }, [valor, delayMs]);

  return debounced;
}

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";

interface ComboBoxProps<T> {
  queryKey: string;
  fetchOptions: (search: string) => Promise<T[]>;
  getLabel: (item: T) => string;
  getId: (item: T) => string;
  onSelect: (item: T) => void;
  placeholder?: string;
  initialLabel?: string;
  disabled?: boolean;
}

export function ComboBox<T>({
  queryKey,
  fetchOptions,
  getLabel,
  getId,
  onSelect,
  placeholder,
  initialLabel = "",
  disabled,
}: ComboBoxProps<T>) {
  const [texto, setTexto] = useState(initialLabel);
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setTexto(initialLabel), [initialLabel]);

  // Se o usuário digitar algo e sair do campo (clique fora ou Tab/Esc) sem
  // clicar numa opção da lista, o texto exibido volta para a última seleção
  // confirmada — evita que o campo mostre um nome diferente do que será
  // realmente salvo no pedido (achado da auditoria).
  useEffect(() => {
    function onClickFora(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setAberto(false);
        setTexto(initialLabel);
      }
    }
    document.addEventListener("mousedown", onClickFora);
    return () => document.removeEventListener("mousedown", onClickFora);
  }, [initialLabel]);

  const { data: opcoes } = useQuery({
    queryKey: [queryKey, texto],
    queryFn: () => fetchOptions(texto),
    enabled: aberto,
  });

  return (
    <div ref={containerRef} className="relative">
      <input
        className="w-full rounded-md border border-border-subtle bg-surface-3 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-400/30"
        placeholder={placeholder}
        value={texto}
        disabled={disabled}
        onChange={(e) => {
          setTexto(e.target.value);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape" || e.key === "Tab") {
            setAberto(false);
            setTexto(initialLabel);
          }
        }}
      />
      {aberto && (opcoes?.length ?? 0) > 0 && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border-subtle bg-surface shadow-lg">
          {opcoes?.map((item) => (
            <li
              key={getId(item)}
              className={clsx("cursor-pointer px-3 py-2 text-sm text-text-primary hover:bg-surface-2")}
              onClick={() => {
                onSelect(item);
                setTexto(getLabel(item));
                setAberto(false);
              }}
            >
              {getLabel(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

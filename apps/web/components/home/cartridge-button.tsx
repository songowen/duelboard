import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import Link from "next/link";

type CartridgeTone = "yellow" | "red";

type CommonProps = {
  children: ReactNode;
  tone?: CartridgeTone;
  className?: string;
  hoverArrow?: boolean;
};

type LinkLikeProps = CommonProps & Omit<ComponentProps<typeof Link>, "href"> & { href: string };
type ButtonLikeProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type CartridgeButtonProps = LinkLikeProps | ButtonLikeProps;

function baseClass(className: string) {
  return [
    "pixel-btn inline-flex items-center justify-center",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f5f5]",
    className,
  ].join(" ");
}

function content(children: ReactNode, hoverArrow: boolean) {
  return (
    <span className="pixel-btn-inner">
      <span className="pixel-btn-face">
        <span className="pixel-btn-label" data-hover-arrow={hoverArrow ? "true" : "false"}>
          {children}
        </span>
      </span>
    </span>
  );
}

export function CartridgeButton(props: CartridgeButtonProps) {
  const tone = props.tone ?? "yellow";
  const className = props.className ?? "";
  const hoverArrow = props.hoverArrow ?? false;

  if ("href" in props && typeof props.href === "string") {
    const { href, children, tone: _tone, className: _className, hoverArrow: _hoverArrow, ...rest } = props;
    return (
      <Link href={href} className={baseClass(className)} data-tone={tone} {...rest}>
        {content(children, hoverArrow)}
      </Link>
    );
  }

  const { children, tone: _tone, className: _className, hoverArrow: _hoverArrow, ...rest } = props;
  return (
    <button type="button" className={baseClass(className)} data-tone={tone} {...rest}>
      {content(children, hoverArrow)}
    </button>
  );
}

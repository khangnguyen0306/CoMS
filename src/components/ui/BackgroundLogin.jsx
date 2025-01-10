
import { cn } from "../../utils/ultil";
import React from "react";

export const AuroraBackground = ({
    className,
    children,
    showRadialGradient = true,
    ...props
}) => {
    return (
        (<main>
            <div
                className={cn(
                    "relative flex flex-col  h-[100vh] items-center justify-center bg-zinc-900 dark:bg-zinc-200  text-slate-100 transition-bg",
                    className
                )}
                {...props}>
                <div className="absolute inset-0 overflow-hidden">
                    <div
                        //   I'm sorry but this is what peak developer performance looks like // trigger warning
                        className={cn(`
          [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_0%,var(--transparent)_6%,var(--transparent)_12%,var(--white)_6%)]
          [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_90%,var(--transparent)_12%,var(--black)_146%)]
          [--aurora:repeating-linear-gradient(100deg,var(--blue-800)_10%,var(--indigo-900)_15%,var(--blue-300)_20%,var(--violet-200)_35%,var(--blue-300)_30%)]
          [background-image:var(--white-gradient),var(--aurora)]
          dark:[background-image:var(--dark-gradient),var(--aurora)]
          [background-size:300%,_200%]
          [background-position:50%_50%,50%_50%]
          filter blur-[10px] invert dark:invert-0
          after:content-[""] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] 
          after:dark:[background-image:var(--dark-gradient),var(--aurora)]
          after:[background-size:200%,_100%] 
          after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
          pointer-events-none
          absolute -inset-[10px] opacity-50 will-change-transform`, showRadialGradient &&
                        `[mask-image:radial-gradient(ellipse_at_100%_0%,black_30%,var(--transparent)_80%)]`)}></div>
                </div>
                {children}
            </div>
        </main>)
    );
};

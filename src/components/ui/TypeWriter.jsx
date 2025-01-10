import { cn } from "../../utils/ultil";
import { motion } from "framer-motion";


export const TypewriterEffectSmooth = ({
    words,
    className,
    cursorClassName
}) => {
    // split text inside of words into array of characters
    const wordsArray = words.map((word) => {
        return {
            ...word,
            text: word.text.split(""),
        };
    });
    const renderWords = () => {
        return (
            (<div>
                {wordsArray.map((word, idx) => {
                    return (
                        (<div key={`word-${idx}`} className="inline-block mr-3">
                            {word.text.map((char, index) => (
                                <span
                                    key={`char-${index}`}
                                    className={cn(`dark:text-white  text-black `, word.className)}>
                                    {char}
                                </span>
                            ))}
                        </div>)
                    );
                })}
            </div>)
        );
    };

    return (
        (<div className={cn("flex space-x-1 my-3", className)}>
            <motion.div
                className="overflow-hidden pb-2"
                initial={{
                    width: "0%",
                }}
                whileInView={{
                    width: "fit-content",
                }}
                transition={{
                    duration: 2,
                    ease: "linear",
                    delay: 1,
                }}>
                <div
                    className="text-xs flex justify-center items-center sm:text-base md:text-xl lg:text:3xl xl:text-5xl font-bold"
                    style={{
                        whiteSpace: "nowrap",
                    }}>
                    {renderWords()}{<motion.span
                        style={{
                            filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.9))',
                        }}
                        className="text-3xl md:text-7xl mb-2 font-bold text-blue-400 dark:text-blue-500 px-3"
                    >
                        CoMS
                    </motion.span>}
                </div>{" "}
            </motion.div>

            <motion.span
                initial={{
                    opacity: 0,
                }}
                animate={{
                    opacity: 1,
                }}
                transition={{
                    duration: 0.8,

                    repeat: Infinity,
                    repeatType: "reverse",
                }}
                className={cn(
                    "block rounded-sm w-[4px]  h-7 sm:h-6 xl:h-20 bg-blue-500 ",
                    cursorClassName
                )}
            >
            </motion.span>
        </div>)
    );
};

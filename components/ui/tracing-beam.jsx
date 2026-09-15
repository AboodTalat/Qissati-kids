"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, useTransform, useScroll, useSpring } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Adapted from Aceternity's Tracing Beam.
 *
 * Changes from the shipped version:
 *  - the beam gradient shipped as neon cyan → violet → purple (#18CCFC,
 *    #6344F5, #AE48FF), the blue the brand brief rules out; recoloured to
 *    teal → gold → berry
 *  - the rail is pinned with `-start-4` instead of `-left-4`, so it sits on
 *    the start edge under dir="rtl"
 */

export const TracingBeam = ({
  children,
  className
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const contentRef = useRef(null);
  const [svgHeight, setSvgHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setSvgHeight(contentRef.current.offsetHeight);
    }
  }, []);

  const y1 = useSpring(useTransform(scrollYProgress, [0, 0.8], [50, svgHeight]), {
    stiffness: 500,
    damping: 90,
  });
  const y2 = useSpring(useTransform(scrollYProgress, [0, 1], [50, svgHeight - 200]), {
    stiffness: 500,
    damping: 90,
  });

  return (
    <motion.div
      ref={ref}
      className={cn("relative mx-auto h-full w-full max-w-4xl", className)}>
      <div className="absolute top-3 -start-4 md:-start-12">
        <motion.div
          transition={{
            duration: 0.2,
            delay: 0.5,
          }}
          animate={{
            boxShadow:
              scrollYProgress.get() > 0
                ? "none"
                : "rgba(0, 0, 0, 0.24) 0px 3px 8px",
          }}
          className="border-netural-200 ml-[27px] flex h-4 w-4 items-center justify-center rounded-full border shadow-sm">
          <motion.div
            transition={{
              duration: 0.2,
              delay: 0.5,
            }}
            animate={{
              backgroundColor: scrollYProgress.get() > 0 ? "white" : "#f4b740",
              borderColor: scrollYProgress.get() > 0 ? "white" : "#146466",
            }}
            className="h-2 w-2 rounded-full border border-brand/40 bg-white" />
        </motion.div>
        <svg
          viewBox={`0 0 20 ${svgHeight}`}
          width="20"
          // Set the SVG height
          height={svgHeight}
          className="ml-4 block"
          aria-hidden="true">
          <motion.path
            d={`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`}
            fill="none"
            stroke="#1f8a8c"
            strokeOpacity="0.22"
            transition={{
              duration: 10,
            }}></motion.path>
          <motion.path
            d={`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="1.25"
            className="motion-reduce:hidden"
            transition={{
              duration: 10,
            }}></motion.path>
          <defs>
            <motion.linearGradient
              id="gradient"
              gradientUnits="userSpaceOnUse"
              x1="0"
              x2="0"
              // set y1 for gradient
              y1={y1}
              // set y2 for gradient
              y2={y2}>
              <stop stopColor="#1f8a8c" stopOpacity="0"></stop>
              <stop stopColor="#1f8a8c"></stop>
              <stop offset="0.325" stopColor="#f4b740"></stop>
              <stop offset="1" stopColor="#b84c6e" stopOpacity="0"></stop>
            </motion.linearGradient>
          </defs>
        </svg>
      </div>
      <div ref={contentRef}>{children}</div>
    </motion.div>
  );
};

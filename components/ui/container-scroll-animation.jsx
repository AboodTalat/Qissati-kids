"use client";
import React, { useRef } from "react";
import { useScroll, useTransform, motion } from "motion/react";

/**
 * Adapted from Aceternity's Container Scroll Animation.
 *
 * Changes from the shipped version:
 *  - the Card is a warm cream/teal stage, not the dark laptop chassis
 *    (#222 bezel, gray-100 / zinc-900 inner) it ships as
 *  - height cut from 60–80rem to 34–46rem; the original reserves so much
 *    scroll that it buries the page's CTAs
 *  - softer tilt (14deg, not 20) and a mobile scale range starting at 0.9
 *    rather than 0.7, which made the book tiny before it settled
 */

export const ContainerScroll = ({
  titleComponent,
  children
}) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.9, 1] : [1.04, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 1], [14, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <div
      className="relative flex min-h-[34rem] items-center justify-center p-2 md:min-h-[46rem] md:p-10"
      ref={containerRef}>
      <div
        className="relative w-full py-8 md:py-16"
        style={{
          perspective: "1000px",
        }}>
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} translate={translate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({
  translate,
  titleComponent
}) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="div max-w-5xl mx-auto text-center">
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
      }}
      className="mx-auto -mt-6 w-full max-w-3xl rounded-blob border border-ink/5 bg-surface/70 p-4 shadow-lift backdrop-blur-sm md:p-8">
      <div className="h-full w-full overflow-hidden rounded-card">
        {children}
      </div>
    </motion.div>
  );
};

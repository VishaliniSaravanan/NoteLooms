// Homepage.jsx
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom'; // Assuming React Router is set up; if not, replace with appropriate navigation
import './Homepage.css';

const Homepage = () => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isMobileOrSmall = typeof window !== 'undefined' && window.innerWidth < 1024;
    if (isMobileOrSmall) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      return;
    }

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const mouse = { x: 0, y: 0 };
    let animationId;

    class Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 1;
        this.baseX = x;
        this.baseY = y;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.color = `rgba(139, 92, 246, ${this.opacity})`;
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      update() {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 150;
        const force = (maxDistance - distance) / maxDistance;
        const angle = Math.atan2(dy, dx);

        this.x += Math.cos(angle) * force * 2;
        this.y += Math.sin(angle) * force * 2;
        this.x += (this.baseX - this.x) * 0.02;
        this.y += (this.baseY - this.y) * 0.02;

        if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
        if (this.y > canvas.height || this.y < 0) this.speedY *= -1;

        this.x += this.speedX;
        this.y += this.speedY;
      }
    }

    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particlesRef.current.push(new Particle(x, y));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current.forEach(particle => {
        particle.update();
        particle.draw();
      });
      animationId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    initParticles();
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="homepage-wrapper">
      <canvas ref={canvasRef} className="particles-canvas" />
      <div className="overlay" />
      <motion.main
        className="homepage-content"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <motion.h1
          className="title"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          NoteLooms
        </motion.h1>
        <motion.p
          className="tagline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Weave your notes into interactive learning experiences.
        </motion.p>
        <div className="modes-container">
          <motion.div
            className="mode-card classic-mode"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h3>Classic Mode</h3>
            <p>Traditional study tools for focused learning.</p>
            <Link to="/classic" className="mode-button">
              Enter Classic Mode
            </Link>
          </motion.div>
          <motion.div
            className="mode-card studio-mode"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <h3>Studio Mode</h3>
            <p>Creative workspace with advanced generation tools.</p>
            <Link to="/studio" className="mode-button">
              Enter Studio Mode
            </Link>
          </div>
        </div>
      </motion.main>
    </div>
  );
};

export default Homepage;
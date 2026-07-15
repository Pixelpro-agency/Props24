import { Home, Users, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import { StatTile } from './StatTile';
import { useDashboardStats } from '../../hooks/useDashboardStats';

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
};

export function StatTilesRow() {
    const stats = useDashboardStats();

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
            <motion.div variants={itemVariants}>
                <StatTile
                    title="Proprietà"
                    icon={Home}
                    counts={stats.properties}
                    manageLink="/properties"
                    archiveLink="/properties/archive"
                />
            </motion.div>

            <motion.div variants={itemVariants}>
                <StatTile
                    title="Inquilini"
                    icon={Users}
                    counts={stats.tenants}
                    manageLink="/tenants"
                    archiveLink="/tenants/archive"
                />
            </motion.div>

            <motion.div variants={itemVariants}>
                <StatTile
                    title="Locazioni"
                    icon={Key}
                    counts={stats.leases}
                    manageLink="/leases"
                    archiveLink="/leases/archive"
                />
            </motion.div>
        </motion.div>
    );
}

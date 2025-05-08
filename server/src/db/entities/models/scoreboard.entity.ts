import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('scoreboards')
export class Scoreboard {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column({ default: 'Default Scoreboard' })
  name: string;

  @OneToMany('Team', 'scoreboard', { cascade: true })
  teams: any[];

  @Column({ nullable: true, type: 'varchar' })
  logoUrl: string | null;

  @Column({ default: 50 })
  logoSize: number;

  @Column({ default: '' })
  titleText: string;

  @Column({ nullable: true, type: 'varchar' })
  footerText: string | null;

  @Column({ default: '#FFFFFF' })
  titleTextColor: string;

  @Column({ default: 2 })
  titleTextSize: number;

  @Column({ default: '#FFFFFF' })
  footerTextColor: string;

  @Column({ default: 1.25 })
  footerTextSize: number;

  @Column({ default: true })
  showScore: boolean;

  @Column({ default: true })
  showPenalties: boolean;

  @Column({ default: true })
  showEmojis: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

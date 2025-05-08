import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column()
  id: string;

  @Column()
  name: string;

  @Column()
  color: string;

  @Column({ default: 0 })
  score: number;

  @Column({ type: 'simple-json', default: '{"major": 0, "minor": 0}' })
  penalties: {
    major: number;
    minor: number;
  };

  @Column({ nullable: true, type: 'varchar' })
  emoji: 'hand' | 'fist' | null;

  @Column({ nullable: true })
  scoreboardId: string;
  
  @ManyToOne('Scoreboard', { nullable: true })
  scoreboard: any;
}

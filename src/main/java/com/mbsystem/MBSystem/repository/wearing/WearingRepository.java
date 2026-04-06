package com.mbsystem.MBSystem.repository.wearing;

import com.mbsystem.MBSystem.domain.Leave;
import com.mbsystem.MBSystem.domain.QWearing;
import com.mbsystem.MBSystem.domain.Wearing;
import com.mbsystem.MBSystem.repository.leave.SDJpaLeaveRepository;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.mbsystem.MBSystem.domain.QLeave.leave;
import static com.mbsystem.MBSystem.domain.QWearing.wearing;

@Repository
public class WearingRepository {

  @Autowired
  private SDJpaWearingRepository wearingRepository;
  private EntityManager em;
  private JPAQueryFactory queryFactory;

  public WearingRepository(EntityManager em) {
    this.em=em;
    this.queryFactory = new JPAQueryFactory(em);
  }

  public Wearing save(Wearing wear) {
    return wearingRepository.save(wear);
  }

  public List<Wearing> findById(Long moduleId){
    return queryFactory.selectFrom(wearing)
        .where(wearing.module.id.eq(moduleId))
        .fetch();
  }

  public void delete(Long moduleId){
    queryFactory.delete(wearing)
        .where(wearing.module.id.eq(moduleId))
        .execute();
  }
}
